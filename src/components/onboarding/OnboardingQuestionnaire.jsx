import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";

import { PERSONAS, QUESTIONS, FIRST_GOALS, determinePersona } from "./questionnaire/config";
import Screen1 from "./questionnaire/Screen1";
import Screen3 from "./questionnaire/Screen3";
import QuizScreen from "./questionnaire/QuizScreen";
import PersonaReveal from "./questionnaire/PersonaReveal";
import Screen10 from "./questionnaire/Screen10";
import Screen11 from "./questionnaire/Screen11";
import Screen12 from "./questionnaire/Screen12";

// ─── Main Component ──────────────────────────────────────────────────────────
const SCREEN = {
  WELCOME: 0,
  QUIZ_INTRO: 1,
  QUIZ: 2,       // 5 sub-screens via questionIndex
  PERSONA: 3,
  GOAL: 4,
  INCOME: 5,
  WELCOME_GAME: 6,
};

export default function OnboardingQuestionnaire({ onClose }) {
  const [screen, setScreen] = useState(SCREEN.WELCOME);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [persona, setPersona] = useState(null);
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [primaryGoalLabel, setPrimaryGoalLabel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const isSavingRef = useRef(false);

  // Analytics: track funnel step (each screen change)
  useEffect(() => {
    try {
      const screenNames = ["welcome", "quiz_intro", "quiz", "persona_reveal", "goal", "income", "welcome_game"];
      base44.analytics.track({
        eventName: "onboarding_step_view",
        properties: {
          step: screenNames[screen] || `screen_${screen}`,
          quiz_question: screen === SCREEN.QUIZ ? questionIndex + 1 : null,
        },
      });
    } catch {}
  }, [screen, questionIndex]);

  function handleAnswer(key) {
    const newAnswers = [...answers, key];
    setAnswers(newAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(i => i + 1);
    } else {
      // All questions done → compute persona
      const p = determinePersona(newAnswers);
      setPersona(p);
      setScreen(SCREEN.PERSONA);
    }
  }

  function handleQuizBack() {
    if (questionIndex > 0) {
      setQuestionIndex(i => i - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }

  function handleGoalNext(goal) {
    const goalObj = FIRST_GOALS.find(g => g.key === goal);
    setPrimaryGoal(goal);
    // If custom goal, the goal string itself IS the label; else use predefined label
    setPrimaryGoalLabel(goalObj?.label || goal);
    setScreen(SCREEN.INCOME);
  }

  async function handleIncomeNext(incomeRange) {
    if (isSavingRef.current) return; // prevent double-submit
    isSavingRef.current = true;
    setSaving(true);
    setSaveError(null);

    const today = new Date().toISOString().split("T")[0];
    const personaData = PERSONAS[persona];

    // If user opted not to share income, store null instead of the sentinel key
    const normalizedIncome = incomeRange === "prefer_not_to_say" ? null : incomeRange;

    try {
      // Check existing records to avoid duplicates (e.g. user re-doing onboarding after admin reset)
      const [existingProfiles, existingPersonas] = await Promise.all([
        base44.entities.GamificationProfile.list(),
        base44.entities.UserPersona.list(),
      ]);
      const needsProfile = !existingProfiles || existingProfiles.length === 0;

      const personaPayload = {
        persona_type: persona,
        persona_label: personaData.label,
        quiz_answers: answers,
        primary_goal: primaryGoal,
        primary_goal_label: primaryGoalLabel,
        income_range: normalizedIncome,
        onboarding_completed_at: today,
      };

      const ops = [
        existingPersonas && existingPersonas.length > 0
          ? base44.entities.UserPersona.update(existingPersonas[0].id, personaPayload)
          : base44.entities.UserPersona.create(personaPayload),
        base44.auth.updateMe({
          onboarding_completed: true,
          primary_goal: primaryGoal,
        }),
      ];

      if (needsProfile) {
        ops.push(base44.entities.GamificationProfile.create({
          total_points: 0,
          level: 1,
          daily_streak: 0,
          last_activity_date: today,
        }));
      }

      await Promise.all(ops);

      // Analytics: track completion
      try {
        base44.analytics.track({
          eventName: "onboarding_completed",
          properties: {
            persona,
            primary_goal: primaryGoal,
            income_range: normalizedIncome,
            quiz_skipped: answers.length === 0,
          },
        });
      } catch {}

      setScreen(SCREEN.WELCOME_GAME);
    } catch (err) {
      setSaveError(err?.message || "Gagal menyimpan data. Coba lagi ya.");
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === SCREEN.WELCOME && (
          <Screen1 key="s1" onNext={() => setScreen(SCREEN.QUIZ_INTRO)} />
        )}
        {screen === SCREEN.QUIZ_INTRO && (
          <Screen3
            key="s3"
            onNext={() => { setScreen(SCREEN.QUIZ); setQuestionIndex(0); setAnswers([]); }}
            onSkip={() => {
              // Skip quiz: default persona "balanced", lanjut ke goal selection
              setPersona("balanced");
              setAnswers([]);
              setScreen(SCREEN.GOAL);
            }}
          />
        )}
        {screen === SCREEN.QUIZ && (
          <QuizScreen
            key={`quiz-${questionIndex}`}
            questionIndex={questionIndex}
            totalQuestions={QUESTIONS.length}
            question={QUESTIONS[questionIndex]}
            onAnswer={handleAnswer}
            onBack={handleQuizBack}
            canGoBack={questionIndex > 0}
          />
        )}
        {screen === SCREEN.PERSONA && persona && (
          <PersonaReveal key="persona" persona={persona} onNext={() => setScreen(SCREEN.GOAL)} />
        )}
        {screen === SCREEN.GOAL && (
          <Screen10 key="goal" onNext={handleGoalNext} />
        )}
        {screen === SCREEN.INCOME && (
          <Screen11 key="income" onNext={handleIncomeNext} loading={saving} error={saveError} />
        )}
        {screen === SCREEN.WELCOME_GAME && (
          <Screen12
            key="done"
            persona={persona}
            primaryGoal={primaryGoal}
            primaryGoalLabel={primaryGoalLabel}
            onDone={() => {
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
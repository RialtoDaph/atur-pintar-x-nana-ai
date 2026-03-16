import { useState } from "react";
import { ArrowRight, ArrowLeft, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TODAY = new Date().toISOString().split("T")[0];

const STEPS = [
{ id: "welcome" },
{ id: "locale" },
{ id: "income" },
{ id: "savings_goal" },
{ id: "debt" },
{ id: "risk" },
{ id: "reminder" },
{ id: "done" }];


const LANGUAGES = [
{ code: "id", label: "Indonesia", flag: "🇮🇩" },
{ code: "en", label: "English", flag: "🇺🇸" }];


const CURRENCIES = [
{ code: "IDR", label: "Rupiah", symbol: "Rp", flag: "🇮🇩" },
{ code: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
{ code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" }];


export default function OnboardingQuestionnaire({ onClose }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form data
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpense, setMonthlyExpense] = useState("");

  const [hasGoal, setHasGoal] = useState(null);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const [hasDebt, setHasDebt] = useState(null);
  const [debtName, setDebtName] = useState("");
  const [debtType, setDebtType] = useState("lainnya");
  const [debtRemaining, setDebtRemaining] = useState("");
  const [debtMonthly, setDebtMonthly] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [selectedCurrency, setSelectedCurrency] = useState("IDR");

  const [riskTolerance, setRiskTolerance] = useState("");
  const [financialGoal, setFinancialGoal] = useState("");

  const [hasReminder, setHasReminder] = useState(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");
  const [reminderDay, setReminderDay] = useState("");

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];

  async function handleFinish() {
    setSaving(true);

    const promises = [];

    // Save income transaction for current month
    if (monthlyIncome) {
      promises.push(base44.entities.Transaction.create({
        amount: parseFloat(monthlyIncome),
        type: "income",
        category: "salary",
        note: "Pendapatan bulanan",
        date: TODAY
      }));
    }

    // Save expense transaction for current month
    if (monthlyExpense) {
      promises.push(base44.entities.Transaction.create({
        amount: parseFloat(monthlyExpense),
        type: "expense",
        category: "other",
        note: "Pengeluaran bulanan",
        date: TODAY
      }));
    }

    // Save savings goal
    if (hasGoal && goalName && goalTarget) {
      promises.push(base44.entities.SavingsGoal.create({
        name: goalName,
        target_amount: parseFloat(goalTarget),
        current_amount: 0,
        deadline: goalDeadline || undefined,
        icon: "🎯",
        color: "#FF6A00",
        status: "active"
      }));
    }

    // Save debt
    if (hasDebt && debtName && debtRemaining) {
      promises.push(base44.entities.Debt.create({
        name: debtName,
        type: debtType,
        total_amount: parseFloat(debtRemaining),
        remaining_amount: parseFloat(debtRemaining),
        monthly_payment: debtMonthly ? parseFloat(debtMonthly) : 0,
        status: "active",
        icon: "💳"
      }));
    }

    // Save risk profile
    if (riskTolerance || financialGoal || monthlyIncome) {
      promises.push(base44.entities.UserRiskProfile.create({
        risk_tolerance: riskTolerance || "moderate",
        financial_goal: financialGoal || "wealth_building",
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        last_assessment_date: TODAY,
        investment_experience: "beginner",
        investment_horizon: "medium_term"
      }));
    }

    // Save reminder
    if (hasReminder && reminderTitle && reminderDay) {
      promises.push(base44.entities.Reminder.create({
        title: reminderTitle,
        type: "tagihan",
        amount: reminderAmount ? parseFloat(reminderAmount) : undefined,
        due_day: parseInt(reminderDay),
        is_active: true,
        icon: "🔔"
      }));
    }

    // Save language & currency settings
    const CURRENCY_MAP = { IDR: "Rp", USD: "$", EUR: "€" };
    promises.push(base44.entities.AppSettings.list().then(async (list) => {
      const payload = {
        language: selectedLanguage,
        currency: selectedCurrency,
        currency_symbol: CURRENCY_MAP[selectedCurrency],
        decimal_separator: selectedCurrency === "IDR" ? "," : ".",
        thousand_separator: selectedCurrency === "IDR" ? "." : ","
      };
      if (list.length > 0) {
        await base44.entities.AppSettings.update(list[0].id, payload);
      } else {
        await base44.entities.AppSettings.create(payload);
      }
    }));

    // Mark onboarding done on user
    promises.push(base44.auth.updateMe({ onboarding_completed: true }));

    await Promise.all(promises);
    setSaving(false);
    onClose();
  }

  function next() {setStep((s) => Math.min(s + 1, totalSteps - 1));}
  function prev() {setStep((s) => Math.max(s - 1, 0));}

  const progress = (step + 1) / totalSteps * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-[#F2F4F7]">
          <div className="h-1 bg-[#FF6A00] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-semibold text-[#8FA4C8]">{step + 1} / {totalSteps}</span>

          </div>

          {/* STEP: Welcome */}
          {currentStep.id === "welcome" &&
          <div className="text-center">
              <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/ba12d8d2f_3.png" alt="Atur Pintar" className="w-20 h-20 mx-auto mb-4 object-contain" />
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Selamat Datang di Atur Pintar</h2>
              <p className="text-sm text-[#4A5568] leading-relaxed mb-6">Jawab beberapa pertanyaan singkat agar kami bisa menyiapkan dasbor sesuai kondisi keuanganmu.

            </p>
              <div className="flex gap-3">
  
                <button onClick={next} className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#e05e00] transition-colors flex items-center justify-center gap-2">
                  Mulai <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          }

          {/* STEP: Locale */}
          {currentStep.id === "locale" &&
          <div>
              <div className="text-3xl mb-3">🌐</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Bahasa & Mata Uang</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Pilih preferensimu. Pengaturan ini <span className="font-semibold text-[#FF6A00]">tidak bisa diubah</span> setelah ini.</p>

              <div className="mb-5">
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Bahasa</label>
                <div className="space-y-2">
                  {LANGUAGES.map((lang) =>
                <button key={lang.code} onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedLanguage === lang.code ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] hover:border-[#CBD5E0]"}`}>
                      <span className="text-xl">{lang.flag}</span>
                      <span className={`text-sm font-semibold ${selectedLanguage === lang.code ? "text-[#FF6A00]" : "text-[#1A1A1A]"}`}>{lang.label}</span>
                    </button>
                )}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Mata Uang</label>
                <div className="space-y-2">
                  {CURRENCIES.map((cur) =>
                <button key={cur.code} onClick={() => setSelectedCurrency(cur.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedCurrency === cur.code ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] hover:border-[#CBD5E0]"}`}>
                      <span className="text-xl">{cur.flag}</span>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${selectedCurrency === cur.code ? "text-[#FF6A00]" : "text-[#1A1A1A]"}`}>{cur.label}</p>
                        <p className="text-xs text-[#8FA4C8]">{cur.symbol} · {cur.code}</p>
                      </div>
                    </button>
                )}
                </div>
              </div>

              <NavButtons onPrev={prev} onNext={next} />
            </div>
          }

          {/* STEP: Income & Expense */}
          {currentStep.id === "income" &&
          <div>
              <div className="text-3xl mb-3">💰</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Pendapatan & Pengeluaran</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Berapa rata-rata keuangan bulanan kamu?</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Pendapatan Bersih / Bulan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium">Rp</span>
                    <input
                    type="number"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                    placeholder="0"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)} />

                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Saldo Anda Saat Ini</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium">Rp</span>
                    <input
                    type="number"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                    placeholder="0"
                    value={monthlyExpense}
                    onChange={(e) => setMonthlyExpense(e.target.value)} />

                  </div>
                </div>
              </div>
              <NavButtons onPrev={prev} onNext={next} />
            </div>
          }

          {/* STEP: Savings Goal */}
          {currentStep.id === "savings_goal" &&
          <div>
              <div className="text-3xl mb-3">🎯</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Tujuan Tabungan</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Apakah kamu punya tujuan tabungan besar?</p>
              <div className="flex gap-3 mb-5">
                {[{ label: "Ya, punya", val: true }, { label: "Belum ada", val: false }].map((opt) =>
              <button key={String(opt.val)} onClick={() => setHasGoal(opt.val)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${hasGoal === opt.val ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] hover:border-[#CBD5E0]"}`}>
                    {opt.label}
                  </button>
              )}
              </div>
              {hasGoal &&
            <div className="space-y-3 mb-5">
                  <input className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="Nama tujuan (misal: DP Rumah)" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
                    <input type="number" className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Target dana" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8FA4C8] font-medium block mb-1">Target Deadline (opsional)</label>
                    <input type="date" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
                  </div>
                </div>
            }
              <NavButtons onPrev={prev} onNext={next} canNext={hasGoal === false || hasGoal && goalName && goalTarget} />
            </div>
          }

          {/* STEP: Debt */}
          {currentStep.id === "debt" &&
          <div>
              <div className="text-3xl mb-3">💳</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Utang / Cicilan</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Apakah kamu punya utang yang sedang berjalan?</p>
              <div className="flex gap-3 mb-5">
                {[{ label: "Ya, punya", val: true }, { label: "Tidak ada", val: false }].map((opt) =>
              <button key={String(opt.val)} onClick={() => setHasDebt(opt.val)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${hasDebt === opt.val ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] hover:border-[#CBD5E0]"}`}>
                    {opt.label}
                  </button>
              )}
              </div>
              {hasDebt &&
            <div className="space-y-3 mb-5">
                  <input className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="Nama utang (misal: KPR BCA)" value={debtName} onChange={(e) => setDebtName(e.target.value)} />
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={debtType} onChange={(e) => setDebtType(e.target.value)}>
                    <option value="kpr">KPR</option>
                    <option value="kendaraan">Kendaraan</option>
                    <option value="kartu_kredit">Kartu Kredit</option>
                    <option value="pinjaman_pribadi">Pinjaman Pribadi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
                    <input type="number" className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Sisa utang" value={debtRemaining} onChange={(e) => setDebtRemaining(e.target.value)} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
                    <input type="number" className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Cicilan / bulan (opsional)" value={debtMonthly} onChange={(e) => setDebtMonthly(e.target.value)} />
                  </div>
                </div>
            }
              <NavButtons onPrev={prev} onNext={next} canNext={hasDebt === false || hasDebt && debtName && debtRemaining} />
            </div>
          }

          {/* STEP: Risk Profile */}
          {currentStep.id === "risk" &&
          <div>
              <div className="text-3xl mb-3">📈</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Profil Investasi</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Ini membantu Nana AI memberikan saran yang lebih personal.</p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Toleransi Risiko</label>
                <div className="space-y-2">
                  {[
                { val: "conservative", label: "Konservatif", desc: "Lebih suka aman, hindari risiko besar" },
                { val: "moderate", label: "Moderat", desc: "Berani ambil sedikit risiko" },
                { val: "aggressive", label: "Agresif", desc: "Siap ambil risiko tinggi demi return besar" }].
                map((opt) =>
                <button key={opt.val} onClick={() => setRiskTolerance(opt.val)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${riskTolerance === opt.val ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] hover:border-[#CBD5E0]"}`}>
                      <p className={`text-sm font-semibold ${riskTolerance === opt.val ? "text-[#FF6A00]" : "text-[#1A1A1A]"}`}>{opt.label}</p>
                      <p className="text-xs text-[#8FA4C8] mt-0.5">{opt.desc}</p>
                    </button>
                )}
                </div>
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Tujuan Utama Investasi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                { val: "wealth_building", label: "Pertumbuhan Kekayaan" },
                { val: "income_generation", label: "Pendapatan Pasif" },
                { val: "capital_preservation", label: "Perlindungan Modal" },
                { val: "retirement", label: "Dana Pensiun" }].
                map((opt) =>
                <button key={opt.val} onClick={() => setFinancialGoal(opt.val)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${financialGoal === opt.val ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] hover:border-[#CBD5E0]"}`}>
                      {opt.label}
                    </button>
                )}
                </div>
              </div>
              <NavButtons onPrev={prev} onNext={next} />
            </div>
          }

          {/* STEP: Reminder */}
          {currentStep.id === "reminder" &&
          <div>
              <div className="text-3xl mb-3">🔔</div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Pengingat Tagihan</h2>
              <p className="text-sm text-[#8FA4C8] mb-5">Apakah ada tagihan rutin yang perlu diingat?</p>
              <div className="flex gap-3 mb-5">
                {[{ label: "Ya, ada", val: true }, { label: "Tidak ada", val: false }].map((opt) =>
              <button key={String(opt.val)} onClick={() => setHasReminder(opt.val)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${hasReminder === opt.val ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568] hover:border-[#CBD5E0]"}`}>
                    {opt.label}
                  </button>
              )}
              </div>
              {hasReminder &&
            <div className="space-y-3 mb-5">
                  <input className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="Nama tagihan (misal: Listrik PLN)" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
                    <input type="number" className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="Nominal (opsional)" value={reminderAmount} onChange={(e) => setReminderAmount(e.target.value)} />
                  </div>
                  <input type="number" min="1" max="31" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="Tanggal jatuh tempo (1-31)" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} />
                </div>
            }
              <NavButtons onPrev={prev} onNext={next} canNext={hasReminder === false || hasReminder && reminderTitle && reminderDay} />
            </div>
          }

          {/* STEP: Done */}
          {currentStep.id === "done" &&
          <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#FF6A00]" />
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Siap! Semuanya Sudah Diatur 🚀</h2>
              <p className="text-sm text-[#4A5568] leading-relaxed mb-6">
                Data keuanganmu sudah kami simpan dan dasbor siap digunakan. Kamu bisa mengedit atau menambah data kapan saja.
              </p>
              <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#e05e00] transition-colors disabled:opacity-50">

                {saving ? "Menyimpan..." : "Mulai Menggunakan Atur.in 🎉"}
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

}

function NavButtons({ onPrev, onNext, canNext = true }) {
  return (
    <div className="flex gap-3">
      <button onClick={onPrev} className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#4A5568] hover:bg-[#F8FAFC] transition-colors flex-shrink-0">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button onClick={onNext} disabled={!canNext}
      className="flex-1 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#e05e00] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
        Lanjut <ArrowRight className="w-4 h-4" />
      </button>
    </div>);

}
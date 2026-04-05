import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook that builds a rich financial context snapshot for Nana AI.
 * This is appended to every message so Nana always has up-to-date data.
 */
export function useFinancialContext(enabled = true) {
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (enabled) buildContext();
  }, [enabled]);

  async function buildContext() {
    try {
      const user = await base44.auth.me();
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastMonth = (() => {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })();

      const [transactions, goals, budgets, debts, investments, reminders, riskProfile, preferences] =
        await Promise.all([
          base44.entities.Transaction.list("-date", 500),
          base44.entities.SavingsGoal.list(),
          base44.entities.Budget.list(),
          base44.entities.Debt.list(),
          base44.entities.Investment.list(),
          base44.entities.Reminder.list(),
          base44.entities.UserRiskProfile.filter({ created_by: user.email }),
          base44.entities.NanaPreferences.filter({ created_by: user.email }),
        ]);

      // Build last 3 months keys
      const prev3Months = [0, 1, 2].map((offset) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 1 - offset, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });

      // This month transactions — exclude recurring templates (is_recurring=true & not child)
      const thisTx = transactions.filter((t) => t.date?.startsWith(thisMonth) && !(t.is_recurring === true && !t.is_recurring_child));
      const lastTx = transactions.filter((t) => t.date?.startsWith(lastMonth) && !(t.is_recurring === true && !t.is_recurring_child));

      const thisIncome = thisTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const thisExpense = thisTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const lastExpense = lastTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      // Calculate projected expense (similar to EstimatedExpense component logic)
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = Math.max(0, daysInMonth - dayOfMonth);
      
      // Get recurring expense templates
      const recurringTemplates = transactions.filter((t) => t.is_recurring && t.type === "expense");
      
      // Count future recurring occurrences this month
      let scheduledFutureExpense = 0;
      const childParentIdsThisMonth = new Set(
        thisTx.filter((t) => t.is_recurring_child && t.recurring_parent_id).map((t) => t.recurring_parent_id)
      );

      for (const tpl of recurringTemplates) {
        const interval = tpl.recurring_interval;
        const templateDate = new Date(tpl.date);
        const templateDay = templateDate.getDate();
        const futureStart = dayOfMonth + 1;

        if (interval === "monthly" && !childParentIdsThisMonth.has(tpl.id)) {
          if (templateDay >= futureStart && templateDay <= daysInMonth) {
            scheduledFutureExpense += tpl.amount;
          }
        } else if (interval === "weekly") {
          const templateWeekday = templateDate.getDay();
          for (let d = futureStart; d <= daysInMonth; d++) {
            const wd = new Date(now.getFullYear(), now.getMonth(), d).getDay();
            if (wd === templateWeekday) scheduledFutureExpense += tpl.amount;
          }
        } else if (interval === "daily") {
          scheduledFutureExpense += tpl.amount * daysLeft;
        }
      }

      // Non-recurring expense average
      const nonRecurringExpense = thisTx.filter((t) => t.type === "expense" && !t.is_recurring_child).reduce((s, t) => s + t.amount, 0);
      const daysElapsed = Math.max(1, dayOfMonth - 1);
      const dailyExpenseAvg = daysElapsed > 0 ? nonRecurringExpense / daysElapsed : 0;
      const projectedExtraExpense = dailyExpenseAvg * Math.max(0, daysLeft) + scheduledFutureExpense;
      const projectedTotalExpense = thisExpense + projectedExtraExpense;

      // Category breakdown this month
      const catBreakdown = {};
      thisTx.filter((t) => t.type === "expense").forEach((t) => {
        const c = t.category || "other";
        catBreakdown[c] = (catBreakdown[c] || 0) + t.amount;
      });

      // Category breakdown last 3 months (average per month)
      const catBreakdown3M = {};
      prev3Months.forEach((m) => {
        transactions.filter((t) => t.date?.startsWith(m) && t.type === "expense").forEach((t) => {
          const c = t.category || "other";
          catBreakdown3M[c] = (catBreakdown3M[c] || 0) + t.amount;
        });
      });
      // Convert to monthly average
      const catAvg3M = {};
      Object.entries(catBreakdown3M).forEach(([k, v]) => { catAvg3M[k] = Math.round(v / 3); });

      // Detect spending spikes: categories where this month > avg3M by >20%
      const spendingSpikes = Object.entries(catBreakdown)
        .filter(([k, v]) => catAvg3M[k] && v > catAvg3M[k] * 1.2)
        .map(([k, v]) => ({ category: k, thisMonth: v, avg3M: catAvg3M[k], spikeRp: v - catAvg3M[k], spikePct: Math.round(((v - catAvg3M[k]) / catAvg3M[k]) * 100) }))
        .sort((a, b) => b.spikeRp - a.spikeRp);

      // Budget status
      const thisMonthBudgets = budgets.filter((b) => b.month === thisMonth);
      const budgetStatus = thisMonthBudgets.map((b) => ({
        category: b.category,
        limit: b.amount,
        spent: catBreakdown[b.category] || 0,
        remaining: b.amount - (catBreakdown[b.category] || 0),
        pct: Math.round(((catBreakdown[b.category] || 0) / b.amount) * 100),
      }));

      // Active debts sorted by interest rate desc
      const activeDebts = debts
        .filter((d) => d.status === "active")
        .sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0));
      const totalDebtRemaining = activeDebts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
      const totalMonthlyDebtPayment = activeDebts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

      // Goals progress
      const activeGoals = goals.filter((g) => g.status === "active").map((g) => {
        const pct = Math.round(((g.current_amount || 0) / (g.target_amount || 1)) * 100);
        const remaining = (g.target_amount || 0) - (g.current_amount || 0);
        const daysLeft = g.deadline
          ? Math.round((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24))
          : null;
        const monthsLeft = daysLeft ? Math.ceil(daysLeft / 30) : null;
        const neededPerMonth = monthsLeft && monthsLeft > 0 ? Math.round(remaining / monthsLeft) : null;
        return { ...g, pct, remaining, daysLeft, monthsLeft, neededPerMonth };
      });

      // Upcoming reminders (due within 10 days)
      const upcomingReminders = reminders
        .filter((r) => r.is_active && r.due_day >= dayOfMonth && r.due_day - dayOfMonth <= 10)
        .sort((a, b) => a.due_day - b.due_day);

      // Investment summary
      const totalInvested = investments.reduce((s, i) => s + (i.initial_amount || 0), 0);
      const totalCurrentValue = investments.reduce((s, i) => s + (i.current_value || 0), 0);

      // Recurring transaction templates (contracts, bills, subscriptions)
      const allRecurringTemplates = transactions.filter(t => t.is_recurring && !t.is_recurring_child);
      const recurringExpenses = allRecurringTemplates.filter(t => t.type === "expense");
      const recurringIncome = allRecurringTemplates.filter(t => t.type === "income" && t.category !== "opening_balance");
      const totalMonthlyRecurringExpense = recurringExpenses.reduce((s, t) => {
        if (t.recurring_interval === "yearly") return s + t.amount / 12;
        if (t.recurring_interval === "weekly") return s + t.amount * 4.33;
        if (t.recurring_interval === "daily") return s + t.amount * 30;
        return s + t.amount;
      }, 0);
      const totalMonthlyRecurringIncome = recurringIncome.reduce((s, t) => {
        if (t.recurring_interval === "yearly") return s + t.amount / 12;
        if (t.recurring_interval === "weekly") return s + t.amount * 4.33;
        if (t.recurring_interval === "daily") return s + t.amount * 30;
        return s + t.amount;
      }, 0);

      // Opening balance
      const openingBalanceTx = transactions.find(t => t.category === "opening_balance");

      const snapshot = {
        date: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        user: { name: user.full_name },
        preferences: preferences?.[0] || null,
        riskProfile: riskProfile?.[0] || null,
        thisMonth: {
          income: thisIncome,
          expense: thisExpense,
          projectedExpense: Math.round(projectedTotalExpense),
          net: thisIncome - thisExpense,
          expenseVsLastMonth: lastExpense ? Math.round(((thisExpense - lastExpense) / lastExpense) * 100) : null,
          categoryBreakdown: catBreakdown,
          categoryAvg3M: catAvg3M,
          spendingSpikes,
        },
        budgetStatus,
        debts: activeDebts.map((d) => ({
          name: d.name,
          type: d.type,
          remaining: d.remaining_amount,
          interestRate: d.interest_rate,
          monthlyPayment: d.monthly_payment,
          dueDate: d.due_date,
        })),
        debtSummary: { totalRemaining: totalDebtRemaining, totalMonthlyPayment: totalMonthlyDebtPayment },
        goals: activeGoals.map((g) => ({
          name: g.name,
          target: g.target_amount,
          current: g.current_amount || 0,
          pct: g.pct,
          remaining: g.remaining,
          deadline: g.deadline,
          daysLeft: g.daysLeft,
          neededPerMonth: g.neededPerMonth,
        })),
        investments: {
          totalInvested,
          totalCurrentValue,
          returnAmount: totalCurrentValue - totalInvested,
          returnPct: totalInvested > 0 ? Math.round(((totalCurrentValue - totalInvested) / totalInvested) * 100) : 0,
          count: investments.length,
        },
        upcomingReminders: upcomingReminders.map((r) => ({
          title: r.title,
          amount: r.amount,
          dueDay: r.due_day,
          daysUntilDue: r.due_day - dayOfMonth,
        })),
        recurringExpenses: recurringExpenses.map(t => ({
          note: t.note,
          amount: t.amount,
          interval: t.recurring_interval,
          category: t.category,
        })),
        recurringIncome: recurringIncome.map(t => ({
          note: t.note,
          amount: t.amount,
          interval: t.recurring_interval,
        })),
        recurringMonthly: {
          totalExpense: Math.round(totalMonthlyRecurringExpense),
          totalIncome: Math.round(totalMonthlyRecurringIncome),
        },
        openingBalance: openingBalanceTx ? openingBalanceTx.amount : null,
      };

      setContext(snapshot);
    } catch (e) {
      console.error("Failed to build financial context:", e);
    }
  }

  function formatContextForMessage(snapshot) {
    if (!snapshot) return "";
    const fmt = (n) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;

    const lines = [
      `\n\n---\n[FINANCIAL_CONTEXT - ${snapshot.date}]`,
      `Pengguna: ${snapshot.user.name}`,
      snapshot.preferences ? `Preferensi: Nada=${snapshot.preferences.tone}, Saran=${(snapshot.preferences.preferred_advice_types || []).join("/")}` : "",
      snapshot.riskProfile ? `Profil Risiko: ${snapshot.riskProfile.risk_tolerance}, Pengalaman=${snapshot.riskProfile.investment_experience}, Tujuan=${snapshot.riskProfile.financial_goal}` : "",
      `\nKEUANGAN BULAN INI:`,
      `- Pemasukan: ${fmt(snapshot.thisMonth.income)}`,
      `- Pengeluaran saat ini: ${fmt(snapshot.thisMonth.expense)}`,
      `- Est. Pengeluaran akhir bulan: ${fmt(snapshot.thisMonth.projectedExpense)}`,
      `- Net: ${fmt(snapshot.thisMonth.net)}${snapshot.thisMonth.expenseVsLastMonth !== null ? ` (pengeluaran ${snapshot.thisMonth.expenseVsLastMonth > 0 ? "+" : ""}${snapshot.thisMonth.expenseVsLastMonth}% vs bulan lalu)` : ""}`,
    ];

    if (snapshot.thisMonth.spendingSpikes?.length > 0) {
      lines.push(`\nLONJAKAN PENGELUARAN vs rata-rata 3 bulan lalu:`);
      snapshot.thisMonth.spendingSpikes.forEach((s) => {
        lines.push(`- ${s.category}: ${fmt(s.thisMonth)} bulan ini vs rata-rata ${fmt(s.avg3M)} (+${s.spikePct}%, lebih boros ${fmt(s.spikeRp)})`);
      });
    }

    if (snapshot.budgetStatus.length > 0) {
      lines.push(`\nSTATUS ANGGARAN:`);
      snapshot.budgetStatus.forEach((b) => {
        const flag = b.pct >= 100 ? " ⚠️OVER" : b.pct >= 80 ? " ⚠️HAMPIR HABIS" : "";
        lines.push(`- ${b.category}: ${fmt(b.spent)}/${fmt(b.limit)} (${b.pct}%)${flag}`);
      });
    }

    if (snapshot.debts.length > 0) {
      lines.push(`\nUTANG AKTIF (urutan bunga tertinggi):`);
      snapshot.debts.forEach((d, i) => {
        lines.push(`${i + 1}. ${d.name} (${d.type}): sisa ${fmt(d.remaining)}, bunga ${d.interestRate || 0}%/tahun, cicilan ${fmt(d.monthlyPayment)}/bulan${d.dueDate ? `, jatuh tempo ${d.dueDate}` : ""}`);
      });
      lines.push(`Total utang: ${fmt(snapshot.debtSummary.totalRemaining)}, total cicilan: ${fmt(snapshot.debtSummary.totalMonthlyPayment)}/bulan`);
    }

    if (snapshot.goals.length > 0) {
      lines.push(`\nTUJUAN TABUNGAN AKTIF:`);
      snapshot.goals.forEach((g) => {
        const urgency = g.daysLeft !== null && g.daysLeft < 30 ? " ⚠️MENDESAK" : "";
        lines.push(`- ${g.name}: ${fmt(g.current)}/${fmt(g.target)} (${g.pct}%), sisa ${fmt(g.remaining)}${g.deadline ? `, deadline ${g.deadline} (${g.daysLeft} hari lagi)` : ""}${g.neededPerMonth ? `, perlu ${fmt(g.neededPerMonth)}/bulan` : ""}${urgency}`);
      });
    }

    if (snapshot.investments.count > 0) {
      lines.push(`\nINVESTASI: ${snapshot.investments.count} portofolio, modal ${fmt(snapshot.investments.totalInvested)}, nilai kini ${fmt(snapshot.investments.totalCurrentValue)} (return ${snapshot.investments.returnPct >= 0 ? "+" : ""}${snapshot.investments.returnPct}%)`);
    }

    if (snapshot.upcomingReminders.length > 0) {
      lines.push(`\nTAGIHAN JATUH TEMPO (10 hari ke depan):`);
      snapshot.upcomingReminders.forEach((r) => {
        lines.push(`- ${r.title}${r.amount ? `: ${fmt(r.amount)}` : ""} — ${r.daysUntilDue === 0 ? "HARI INI" : `${r.daysUntilDue} hari lagi`}`);
      });
    }

    if (snapshot.recurringExpenses?.length > 0) {
      lines.push(`\nPENGELUARAN BERULANG (kontrak/tagihan/langganan):`);
      snapshot.recurringExpenses.forEach((t) => {
        lines.push(`- ${t.note} [${t.category}]: ${fmt(t.amount)}/${t.interval}`);
      });
      lines.push(`Total setara bulanan: ${fmt(snapshot.recurringMonthly.totalExpense)}`);
    }

    if (snapshot.recurringIncome?.length > 0) {
      lines.push(`\nPENDAPATAN BERULANG:`);
      snapshot.recurringIncome.forEach((t) => {
        lines.push(`- ${t.note}: ${fmt(t.amount)}/${t.interval}`);
      });
      lines.push(`Total setara bulanan: ${fmt(snapshot.recurringMonthly.totalIncome)}`);
    }

    if (snapshot.openingBalance) {
      lines.push(`\nSALDO AWAL (saat onboarding): ${fmt(snapshot.openingBalance)}`);
    }

    lines.push(`[/FINANCIAL_CONTEXT]\n---`);
    return lines.filter(Boolean).join("\n");
  }

  return { context, formatContextForMessage };
}
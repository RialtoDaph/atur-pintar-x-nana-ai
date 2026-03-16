import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Background component that checks budgets and creates Nana AI alerts
 * when spending approaches or exceeds budget limits.
 * Runs once per session per month to avoid duplicate alerts.
 */
export default function BudgetAlertChecker({ user, budgets, spendingByCategory }) {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user?.email || !budgets?.length || checkedRef.current) return;

    const sessionKey = `budget_alert_checked_${user.email}_${new Date().toISOString().slice(0, 7)}`;
    if (sessionStorage.getItem(sessionKey)) return;

    checkedRef.current = true;
    sessionStorage.setItem(sessionKey, "1");

    checkAndCreateAlerts();
  }, [user, budgets, spendingByCategory]);

  async function checkAndCreateAlerts() {
    const alertsToCreate = [];

    for (const budget of budgets) {
      const spent = spendingByCategory[budget.category] || 0;
      const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      if (pct < 70) continue; // Only alert at 70%+

      const severity = pct >= 100 ? "high" : pct >= 85 ? "medium" : "low";
      const isOver = pct >= 100;

      const alertType = isOver ? "budget_exceeded" : "bill_upcoming";
      const catLabel = budget.category;
      const overage = isOver ? `Rp ${Math.round(spent - budget.amount).toLocaleString("id-ID")}` : "";
      const remaining = !isOver ? `Rp ${Math.round(budget.amount - spent).toLocaleString("id-ID")}` : "";

      const title = isOver
        ? `Anggaran ${catLabel} terlampaui!`
        : `Anggaran ${catLabel} mendekati batas (${Math.round(pct)}%)`;

      const message = isOver
        ? `Pengeluaran kamu di kategori ${catLabel} sudah melebihi anggaran sebesar ${overage}. Tinjau pengeluaranmu dan pertimbangkan untuk mengurangi di sisa bulan ini.`
        : `Kamu sudah menggunakan ${Math.round(pct)}% dari anggaran ${catLabel}. Sisa anggaran: ${remaining}. Hemat lebih bijak hingga akhir bulan!`;

      alertsToCreate.push({
        type: alertType,
        title,
        message,
        severity,
        status: "unread",
        category: budget.category,
        metadata: { spent, budget: budget.amount, percent: Math.round(pct) },
      });
    }

    if (alertsToCreate.length === 0) return;

    // Check existing unread alerts this month to avoid duplicates
    try {
      const existing = await base44.entities.Alert.filter({ status: "unread", created_by: user.email });
      const existingTitles = new Set(existing.map(a => a.title));

      const newAlerts = alertsToCreate.filter(a => !existingTitles.has(a.title));
      await Promise.all(newAlerts.map(a => base44.entities.Alert.create(a)));
    } catch (e) {
      // Silent fail — non-critical
    }
  }

  return null;
}
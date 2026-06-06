import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * AdminStatBar — horizontal scroll chip bar of key KPIs.
 * Sticky on mobile so admin always sees top metrics while scrolling Inbox.
 */
export default function AdminStatBar() {
  const [stats, setStats] = useState({
    pending: 0,
    feedback: 0,
    notOnboarded: 0,
    mrr: 0,
    totalUsers: 0,
    premium: 0,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [users, pending, feedback, approved, appConfigRes] = await Promise.all([
          base44.entities.User.list().catch(() => []),
          base44.entities.SubscriptionPayment.filter({ status: "pending" }).catch(() => []),
          base44.entities.FeedbackReport.filter({ status: "open" }).catch(() => []),
          base44.entities.SubscriptionPayment.filter({ status: "approved" }).catch(() => []),
          base44.entities.AppConfig.list().catch(() => []),
        ]);
        if (!mounted) return;

        const config = appConfigRes?.[0] || {};
        const priceMonthly = config.premium_price_monthly || 49000;
        const priceYearly = config.premium_price_yearly || 399900;

        const premiumMonthly = users.filter((u) => u.subscription_plan === "premium_monthly" && u.subscription_status === "active").length;
        const premiumYearly = users.filter((u) => u.subscription_plan === "premium_yearly" && u.subscription_status === "active").length;
        const premium = premiumMonthly + premiumYearly;
        const mrr = premiumMonthly * priceMonthly + premiumYearly * Math.round(priceYearly / 12);
        const notOnboarded = users.filter((u) => !u.onboarding_completed).length;

        setStats({
          pending: pending.length,
          feedback: feedback.length,
          notOnboarded,
          mrr: Math.round(mrr),
          totalUsers: users.length,
          premium,
        });
      } catch {}
    };
    load();
    const interval = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const chips = [
    { label: "Pending", value: stats.pending, accent: stats.pending > 0 ? "text-[#EF4444]" : "text-[#1A1A1A]" },
    { label: "Feedback", value: stats.feedback, accent: stats.feedback > 0 ? "text-[#F97316]" : "text-[#1A1A1A]" },
    { label: "Belum Onboard", value: stats.notOnboarded, accent: "text-[#1A1A1A]" },
    { label: "MRR", value: `Rp ${stats.mrr.toLocaleString("id-ID")}`, accent: "text-[#1A1A1A]" },
    { label: "Total User", value: stats.totalUsers, accent: "text-[#1A1A1A]" },
    { label: "Premium", value: stats.premium, accent: "text-[#1A1A1A]" },
  ];

  return (
    <div className="sticky top-14 sm:top-0 z-20 bg-[#F2F4F7] -mx-4 sm:-mx-8 px-4 sm:px-8 py-2 border-b border-[#E2E8F0]">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {chips.map((c) => (
          <div
            key={c.label}
            className="flex-shrink-0 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 min-w-[110px]"
          >
            <p className="text-[10px] text-[#8FA4C8] font-medium uppercase tracking-wider">{c.label}</p>
            <p className={`text-base font-bold mt-0.5 ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
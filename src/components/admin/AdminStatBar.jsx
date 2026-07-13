import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * AdminStatBar — horizontal scroll chip bar of key KPIs.
 * Sticky on mobile so admin always sees top metrics while scrolling Inbox.
 */
export default function AdminStatBar() {
  const [stats, setStats] = useState({
    feedback: 0,
    notOnboarded: 0,
    totalUsers: 0,
    premium: 0,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [users, feedback] = await Promise.all([
          base44.entities.User.list().catch(() => []),
          base44.entities.FeedbackReport.filter({ status: "open" }).catch(() => []),
        ]);
        if (!mounted) return;

        const premiumMonthly = users.filter((u) => u.subscription_plan === "premium_monthly" && u.subscription_status === "active").length;
        const premiumYearly = users.filter((u) => u.subscription_plan === "premium_yearly" && u.subscription_status === "active").length;
        const premium = premiumMonthly + premiumYearly;
        const notOnboarded = users.filter((u) => !u.onboarding_completed).length;

        setStats({
          feedback: feedback.length,
          notOnboarded,
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
    { label: "Feedback", value: stats.feedback, accent: stats.feedback > 0 ? "text-[#F97316]" : "text-[#1A1A1A]" },
    { label: "Belum Onboard", value: stats.notOnboarded, accent: "text-[#1A1A1A]" },
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
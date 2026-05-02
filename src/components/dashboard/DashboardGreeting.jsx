export default function DashboardGreeting({ user, gamificationProfile }) {
  const hour = new Date().getHours();

  // Use display name from full_name, fallback to email prefix, then "Kamu"
  const rawName = user?.full_name?.trim();
  const emailPrefix = user?.email?.split("@")[0];
  const name = (rawName && rawName.length > 0 ? rawName.split(" ")[0] : null)
    || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : null)
    || "Kamu";

  let greeting;
  if (hour >= 6 && hour < 11) greeting = `Pagi, ${name}! ☀️`;
  else if (hour >= 11 && hour < 15) greeting = `Halo, ${name}! 👋`;
  else if (hour >= 15 && hour < 19) greeting = `Sore, ${name}! 🌤️`;
  else greeting = `Malam, ${name}! 🌙`;

  const streak = gamificationProfile?.daily_streak ?? 0;

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white text-xl font-bold">{greeting}</h2>
      {streak > 0 && (
        <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
          <span className="text-sm">🔥</span>
          <span className="text-white text-[11px] font-bold">{streak}hari</span>
        </div>
      )}
    </div>
  );
}
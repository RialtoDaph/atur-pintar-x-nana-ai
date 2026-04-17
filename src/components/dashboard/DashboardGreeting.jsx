export default function DashboardGreeting({ user, gamificationProfile }) {
  const hour = new Date().getHours();
  const name = user?.full_name?.split(" ")[0] || "Kamu";

  let greeting;
  if (hour >= 6 && hour < 11) greeting = `Pagi, ${name}! ☀️`;
  else if (hour >= 11 && hour < 15) greeting = `Halo, ${name}! 👋`;
  else if (hour >= 15 && hour < 19) greeting = `Sore, ${name}! 🌤️`;
  else greeting = `Malam, ${name}! 🌙`;

  const streak = gamificationProfile?.daily_streak ?? 0;

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-white text-xl font-bold">{greeting}</h2>
      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
        <span className="text-base">🔥</span>
        <span className="text-white text-xs font-bold">Streak {streak} hari</span>
      </div>
    </div>
  );
}
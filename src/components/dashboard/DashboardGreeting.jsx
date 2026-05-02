// Sanitize display name: handle "sakit, amnahfy" style entries
export function sanitizeDisplayName(fullName) {
  if (!fullName) return null;
  let name = fullName.trim();
  // If name contains a comma, take the part AFTER the last comma (e.g. "sakit, Amnahfy" → "Amnahfy")
  if (name.includes(",")) {
    const parts = name.split(",");
    name = parts[parts.length - 1].trim();
  }
  // Take first word only
  name = name.split(/\s+/)[0];
  // Remove leading/trailing non-letter chars
  name = name.replace(/^[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+|[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+$/g, "");
  return name || null;
}

export default function DashboardGreeting({ user, gamificationProfile }) {
  const hour = new Date().getHours();

  const emailPrefix = user?.email?.split("@")[0];
  const name = sanitizeDisplayName(user?.full_name)
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
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

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function DashboardGreeting({ user, gamificationProfile }) {
  const hour = new Date().getHours();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("darkMode") === "true");

  const emailPrefix = user?.email?.split("@")[0];
  const name = sanitizeDisplayName(user?.full_name)
    || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : null)
    || "Kamu";

  let greeting;
  if (hour >= 6 && hour < 11) greeting = `Pagi, ${name}!`;
  else if (hour >= 11 && hour < 15) greeting = `Halo, ${name}!`;
  else if (hour >= 15 && hour < 19) greeting = `Sore, ${name}!`;
  else greeting = `Malam, ${name}!`;

  const streak = gamificationProfile?.daily_streak ?? 0;
  // Match backend WIB date so users outside Indonesia see the right state.
  const wibTodayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isActiveToday = gamificationProfile?.last_activity_date === wibTodayStr;
  // Streak > 0 + belum transaksi hari ini = sedang dilindungi freeze (atau menunggu input).
  const isFrozen = streak > 0 && !isActiveToday;

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", next ? "true" : "false");
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white sm:text-[#1A1A1A] dark:sm:text-white text-xl font-bold">{greeting}</h2>
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <Link
            to="/Gamifikasi"
            className="flex items-center gap-1 bg-white/10 sm:bg-black/5 hover:bg-white/20 sm:hover:bg-black/10 active:bg-white/25 transition-colors px-2.5 py-1 rounded-full tap-highlight-fix"
            title={isFrozen ? "Streak terkunci freeze — catat transaksi biar makin panjang" : "Streak aktif hari ini"}
          >
            <span className="text-sm">{isFrozen ? "❄️" : "🔥"}</span>
            <span className="text-white sm:text-[#1A1A1A] dark:sm:text-white text-[11px] font-bold">{streak} hari</span>
          </Link>
        )}
        <button
          onClick={toggleDark}
          className="w-8 h-8 rounded-full bg-white/10 sm:bg-black/5 flex items-center justify-center text-base hover:bg-white/20 sm:hover:bg-black/10 transition-all tap-highlight-fix"
          title={isDark ? "Mode Terang" : "Mode Gelap"}
        >
          {isDark ? "🌙" : "☀️"}
        </button>
      </div>
    </div>
  );
}
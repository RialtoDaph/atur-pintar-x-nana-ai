import { Link } from "react-router-dom";

function getNanaComment(amount) {
  if (amount === 0) return "";
  if (amount < 50000) return "Hemat banget hari ini! 💪";
  if (amount < 200000) return "Masih terkontrol. Good job!";
  if (amount < 500000) return "Lumayan nih, pantau terus ya.";
  return "Lumayan banyak nih — cek budgetmu! 👀";
}

export default function NanaInsightCard({ todayExpense }) {
  const hasData = todayExpense > 0;
  const comment = getNanaComment(todayExpense);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] flex items-center justify-center flex-shrink-0 text-base shadow">
        ✨
      </div>
      <div className="flex-1 min-w-0">
        {hasData ? (
          <p className="text-sm text-[#1A1A1A] leading-snug">
            Pengeluaran hari ini <span className="font-bold text-[#FF6B35]">Rp {todayExpense.toLocaleString("id-ID")}</span>.{" "}
            <span className="text-[#4A5568]">{comment}</span>
          </p>
        ) : (
          <p className="text-sm text-[#4A5568] leading-snug">
            Belum ada catatan hari ini. Yuk mulai catat! 📝
          </p>
        )}
      </div>
      <Link
        to="/Nana"
        className="flex-shrink-0 text-[11px] font-bold text-[#FF6B35] bg-[#FFF0E8] px-2.5 py-1.5 rounded-xl whitespace-nowrap"
      >
        Tanya Nana →
      </Link>
    </div>
  );
}
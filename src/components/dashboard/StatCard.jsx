export default function StatCard({ label, value, icon, accent }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EFEFED]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest text-[#9B9B9B] uppercase">{label}</p>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accent + "18", color: accent }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{value}</p>
    </div>
  );
}
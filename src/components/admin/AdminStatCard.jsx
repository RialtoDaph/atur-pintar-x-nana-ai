export default function AdminStatCard({ icon: Icon, label, value, sub, color = "orange", trend }) {
  const colorMap = {
    orange: "bg-[#FF6A00]/10 text-[#FF6A00]",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#8FA4C8] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{value}</p>
          {sub && <p className="text-xs text-[#8FA4C8] mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? "+" : ""}{trend}% vs last month
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
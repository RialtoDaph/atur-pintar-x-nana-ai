export default function SubscriptionExpiredBanner() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
      <span className="text-lg">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-700">Langganan kamu sudah berakhir</p>
        <p className="text-xs text-red-500">Perpanjang untuk akses fitur premium</p>
      </div>
      <a href="/Subscription" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Perpanjang</a>
    </div>
  );
}
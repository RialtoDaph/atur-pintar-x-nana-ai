export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-2xl font-bold text-white mb-3">Sedang dalam Pemeliharaan</h1>
        <p className="text-[#8FA4C8] text-sm leading-relaxed mb-6">
          Atur Pintar sedang dalam pemeliharaan. Silakan coba lagi beberapa saat. Kami akan segera kembali!
        </p>
        <div className="flex items-center justify-center gap-2 text-[#FF6A00] text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />
          Dalam perbaikan
        </div>
        <p className="text-white/20 text-xs mt-8">© 2026 Atur Pintar</p>
      </div>
    </div>
  );
}
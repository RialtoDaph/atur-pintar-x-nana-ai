import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Check, X, Loader2, Receipt } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";

export default function ReceiptScanHistory() {
  const { formatCurrency } = useAppSettings();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.ReceiptScan.filter({ created_by: u.email }, "-scanned_at", 50)
        .then(data => setScans(data || []))
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  const statusConfig = {
    confirmed: { label: "Dikonfirmasi", color: "#16A34A", bg: "#F0FDF4" },
    rejected: { label: "Ditolak", color: "#DC2626", bg: "#FEF2F2" },
    pending: { label: "Menunggu", color: "#F97316", bg: "#FFF7ED" },
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-xs font-medium">Riwayat</p>
          <h1 className="text-white text-xl font-bold mt-0.5">Scan Struk</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
            ))}
          </div>
        )}

        {!loading && scans.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Receipt className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#8FA4C8] text-sm">Belum ada struk yang dipindai</p>
            <p className="text-[10px] text-[#8FA4C8] mt-1">Scan struk saat tambah transaksi via tombol Kamera / Galeri</p>
          </div>
        )}

        {!loading && scans.map(scan => {
          const cfg = statusConfig[scan.status] || statusConfig.pending;
          const dateStr = scan.scanned_at ? new Date(scan.scanned_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
          return (
            <div key={scan.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#F2F4F7]">
                  <img src={scan.image_url} alt="struk" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0A0A0A] text-sm truncate">{scan.merchant_name || "Merchant tidak diketahui"}</p>
                  <p className="text-[11px] text-[#8FA4C8] mt-0.5">{dateStr}</p>
                  {scan.total_amount > 0 && (
                    <p className="text-sm font-bold text-[#F97316] mt-0.5">{formatCurrency(scan.total_amount)}</p>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
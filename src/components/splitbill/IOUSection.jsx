import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Trash2, HandCoins } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

export default function IOUSection() {
  const [ious, setIous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadIOUs(); }, [user]);

  async function loadIOUs() {
    setLoading(true);
    const data = await base44.entities.SplitIOU.filter({ created_by: user.email }, "-created_date");
    setIous(data);
    setLoading(false);
  }

  async function markPaid(id) {
    await base44.entities.SplitIOU.update(id, { status: "paid" });
    loadIOUs();
  }

  async function deleteIOU(id) {
    await base44.entities.SplitIOU.delete(id);
    loadIOUs();
  }

  const unpaid = ious.filter((i) => i.status === "unpaid");
  const paid = ious.filter((i) => i.status === "paid");
  const totalUnpaid = unpaid.reduce((s, i) => s + i.amount, 0);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
      </div>);

  }

  return (
    <div className="mt-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-1.5"><span>💸</span><span className="text-slate-950">Tagihan Split Bill</span></h2>
          <p className="text-[#8FA4C8] text-xs">Orang yang belum bayar ke kamu</p>
        </div>
        {totalUnpaid > 0 &&
        <div className="bg-[#FF6A00]/20 rounded-xl px-3 py-1.5 text-right">
            <p className="text-[#FF6A00] text-xs font-medium">Belum diterima</p>
            <p className="text-white text-sm font-bold">{formatRupiah(totalUnpaid)}</p>
          </div>
        }
      </div>

      {unpaid.length === 0 ?
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <HandCoins className="w-10 h-10 text-[#8FA4C8] mx-auto mb-2" />
          <p className="text-[#4A5568] font-semibold text-sm">Semua sudah lunas!</p>
          <p className="text-[#8FA4C8] text-xs mt-1">Tidak ada tagihan split bill yang tertunda</p>
        </div> :

      <div className="space-y-2">
          {unpaid.map((iou) =>
        <div key={iou.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-lg flex-shrink-0">
                🤝
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A1A1A] text-sm">{iou.debtor_name}</p>
                <p className="text-xs text-[#8FA4C8] truncate">{iou.store_name} · {iou.date}</p>
                {iou.notes && <p className="text-xs text-[#8FA4C8] truncate">{iou.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#FF6A00] font-bold text-sm">{formatRupiah(iou.amount)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => markPaid(iou.id)} className="w-8 h-8 rounded-full bg-[#00C9A7]/10 flex items-center justify-center text-[#00C9A7] hover:bg-[#00C9A7]/20 transition-colors" title="Tandai sudah dibayar">
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={() => deleteIOU(iou.id)} className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-[#FF6B6B] hover:bg-[#FF6B6B]/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
        )}
        </div>
      }

      {paid.length > 0 &&
      <div className="bg-white rounded-2xl p-4 shadow-sm mt-3">
          <p className="text-sm font-semibold text-[#8FA4C8] mb-2">✅ Sudah Dibayar ({paid.length})</p>
          {paid.map((iou) =>
        <div key={iou.id} className="flex items-center justify-between py-2 border-t border-[#F2F4F7] first:border-0">
              <div>
                <span className="text-sm text-[#4A5568] line-through">{iou.debtor_name}</span>
                <span className="text-xs text-[#8FA4C8] ml-2">{iou.store_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8FA4C8] line-through">{formatRupiah(iou.amount)}</span>
                <button onClick={() => deleteIOU(iou.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        )}
        </div>
      }
    </div>);

}
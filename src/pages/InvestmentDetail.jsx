import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useAppSettings } from "@/components/utils/useAppSettings";
import InvestmentHistory from "@/components/investments/InvestmentHistory";
import TaxCalculator from "@/components/investments/TaxCalculator";
import { INVESTMENT_TYPES_MAP, UNIT_LABELS } from "@/components/investments/investmentConstants";

export default function InvestmentDetail() {
  const { formatCurrency, t, settings } = useAppSettings();
  const lang = settings.language === 'en' ? 'en' : 'id';
  const [params] = useSearchParams();
  const investmentId = params.get("id");
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (investmentId) {
      loadInvestment();
    }
  }, [investmentId]);

  async function loadInvestment() {
    try {
      const inv = await base44.entities.Investment.filter({ id: investmentId });
      setInvestment(inv[0] || null);
    } catch (e) {
      console.error("Failed to load investment:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const msg = lang === 'en' ? 'Delete this investment?' : 'Hapus investasi ini?';
    if (window.confirm(msg)) {
      await base44.entities.Investment.delete(investmentId);
      window.location.href = createPageUrl("Investments");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6A00] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] p-5">
        <Link to={createPageUrl("Investments")} className="text-[#FF6A00] font-medium flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back' : 'Kembali'}
        </Link>
        <p className="text-center text-[#8FA4C8] mt-10">
          {lang === 'en' ? 'Investment not found' : 'Investasi tidak ditemukan'}
        </p>
      </div>
    );
  }

  const type = INVESTMENT_TYPES_MAP[investment.type] || INVESTMENT_TYPES_MAP.lainnya;
  const typeLabel = lang === 'en' ? type.label_en : type.label_id;
  const unitLabel = UNIT_LABELS[investment.type]?.[lang] || (lang === 'en' ? 'Units' : 'Unit');
  const gain = investment.current_value - investment.initial_amount;
  const gainPct = investment.initial_amount > 0 ? ((gain / investment.initial_amount) * 100).toFixed(2) : 0;
  const isPositive = gain >= 0;
  const daysInvested = Math.floor(
    (new Date() - new Date(investment.purchase_date || new Date())) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-10">
        <div className="max-w-2xl mx-auto">
          <Link
            to={createPageUrl("Investments")}
            className="flex items-center gap-2 text-[#FF6A00] font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back' : 'Kembali'}
          </Link>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#FF6A00]/20 flex items-center justify-center text-2xl">
                  {investment.icon || type.emoji}
                  </div>
                  <div>
                  <h1 className="text-white text-2xl font-bold">{investment.name}</h1>
                  <p className="text-[#8FA4C8] text-sm">{typeLabel}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="text-[#FF6B6B] hover:text-[#ff5252] transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-white/60 text-sm mb-1">{lang === 'en' ? 'Current Value' : 'Nilai Sekarang'}</p>
            <p className="text-white font-bold text-3xl mb-3">{formatCurrency(investment.current_value)}</p>
            <div className="flex items-center gap-2 mb-4">
              {isPositive ? <TrendingUp className="w-4 h-4 text-[#00C9A7]" /> : <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />}
              <span className={`font-semibold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {isPositive ? "+" : ""}{formatCurrency(gain)} ({isPositive ? "+" : ""}{gainPct}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60 mb-1">{lang === 'en' ? 'Initial Amount' : 'Modal Awal'}</p>
                <p className="text-white font-bold">{formatCurrency(investment.initial_amount)}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">{lang === 'en' ? 'Duration' : 'Lama Investasi'}</p>
                <p className="text-white font-bold">{daysInvested} {lang === 'en' ? 'days' : 'hari'}</p>
              </div>
              {investment.quantity && (
                <div>
                  <p className="text-white/60 mb-1">{unitLabel}</p>
                  <p className="text-white font-bold">{investment.quantity} {unitLabel.toLowerCase()}</p>
                </div>
              )}
              {investment.price_per_unit && (
                <div>
                  <p className="text-white/60 mb-1">
                    {investment.type === 'emas'
                      ? (lang === 'en' ? 'Price/Gram' : 'Harga/Gram')
                      : (lang === 'en' ? 'Price/Unit' : 'Harga/Unit')}
                  </p>
                  <p className="text-white font-bold">{formatCurrency(investment.price_per_unit)}</p>
                </div>
              )}
              {investment.purchase_date && (
                <div>
                  <p className="text-white/60 mb-1">{lang === 'en' ? 'Purchase Date' : 'Tanggal Beli'}</p>
                  <p className="text-white font-bold">
                    {new Date(investment.purchase_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <InvestmentHistory investmentId={investmentId} formatCurrency={formatCurrency} />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <TaxCalculator investmentId={investmentId} formatCurrency={formatCurrency} />
        </div>

        {investment.notes && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{lang === 'en' ? 'Notes' : 'Catatan'}</h3>
            <p className="text-sm text-[#4A5568]">{investment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
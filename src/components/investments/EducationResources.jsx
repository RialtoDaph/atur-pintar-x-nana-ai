import { useState } from "react";
import { ExternalLink, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

const RESOURCES = {
  id: [
    { id: "stocks-idx", title: "Panduan Pemula Investasi Saham", category: "Saham", url: "https://www.idx.co.id/en/", description: "Pelajari dasar-dasar investasi saham dari BEI" },
    { id: "reksa-dana-ojk", title: "Apa itu Reksa Dana?", category: "Reksa Dana", url: "https://www.ojk.go.id", description: "Memahami jenis-jenis reksa dana dan cara kerjanya" },
    { id: "crypto-investopedia", title: "Investasi Crypto untuk Pemula", category: "Crypto", url: "https://www.investopedia.com/crypto", description: "Pengenalan lengkap tentang cryptocurrency" },
    { id: "diversification-id", title: "Strategi Diversifikasi Portofolio", category: "Strategi", url: "https://www.investopedia.com/portfolio", description: "Cara membuat portofolio yang seimbang" },
    { id: "tax-pajak", title: "Perhitungan Pajak Investasi", category: "Pajak", url: "https://www.pajak.go.id", description: "Kewajiban pajak atas keuntungan investasi" },
  ],
  en: [
    { id: "stocks-idx", title: "Beginner's Guide to Stock Investing", category: "Stocks", url: "https://www.idx.co.id/en/", description: "Learn the basics from Indonesia Stock Exchange" },
    { id: "mutual-fund", title: "What is a Mutual Fund?", category: "Mutual Fund", url: "https://www.ojk.go.id", description: "Understanding types of mutual funds" },
    { id: "crypto-investopedia", title: "Crypto Investing for Beginners", category: "Crypto", url: "https://www.investopedia.com/crypto", description: "Introduction to cryptocurrency and blockchain" },
    { id: "diversification-en", title: "Portfolio Diversification Strategy", category: "Strategy", url: "https://www.investopedia.com/portfolio", description: "How to build a balanced portfolio" },
    { id: "tax-en", title: "Investment Tax Calculation", category: "Tax", url: "https://www.pajak.go.id", description: "Tax obligations on investment gains" },
  ],
};

export default function EducationResources() {
  const { settings } = useAppSettings();
  const lang = settings.language === 'en' ? 'en' : 'id';
  const resources = RESOURCES[lang];
  const title = lang === 'en' ? 'Learning Resources' : 'Sumber Edukasi';
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF6A00]" />
          <span className="font-semibold text-[#1A1A1A] text-sm">{title}</span>
          <span className="text-xs text-[#8FA4C8]">({resources.length})</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#8FA4C8]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-2 border-t border-[#F2F4F7]">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-xl hover:bg-[#F2F4F7] transition-colors group mt-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest">{resource.category}</p>
                <p className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#FF6A00] transition-colors">{resource.title}</p>
                <p className="text-xs text-[#8FA4C8] mt-0.5">{resource.description}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#CBD5E0] group-hover:text-[#FF6A00] flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
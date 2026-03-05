import { useState, useRef, useEffect } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AssetSearch({ type, onSelect, placeholder = "Cari aset..." }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length < 1) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await base44.functions.invoke('searchAssets', {
          query: searchTerm,
          type: type
        });
        setResults(response.data?.results || []);
        setShowResults(true);
      } catch (e) {
        console.log('Search failed:', e.message);
        setResults([]);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, type]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(asset) {
    onSelect(asset);
    setSearchTerm("");
    setShowResults(false);
    setResults([]);
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowResults(true)}
          className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF6A00] animate-spin" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((asset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(asset)}
              className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{asset.name}</p>
                  <p className="text-xs text-[#8FA4C8]">{asset.symbol} · {asset.priceFormatted || `$${asset.price?.toFixed(2)}`}</p>
                </div>
                <div className="text-right">
                  {asset.changePercent && (
                    <p className={`text-xs font-semibold ${asset.changePercent >= 0 ? 'text-[#00C9A7]' : 'text-[#FF6B6B]'}`}>
                      {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </p>
                  )}
                  {asset.change24h && !asset.changePercent && (
                    <p className={`text-xs ${asset.change24h >= 0 ? 'text-[#00C9A7]' : 'text-[#FF6B6B]'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchTerm && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-[#8FA4C8]">Aset tidak ditemukan</p>
        </div>
      )}
    </div>
  );
}
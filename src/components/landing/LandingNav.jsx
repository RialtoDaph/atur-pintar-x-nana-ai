import { Link, useNavigate } from "react-router-dom";

export default function LandingNav({ howRef, pricingRef }) {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 sm:px-12 lg:px-20 py-3 bg-[#0A0A0A]/95 border-b border-white/5">
      <div className="flex items-center gap-2">
        <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo Atur Pintar — aplikasi keuangan AI" width="28" height="28" className="w-7 h-7" />
        <span className="font-black text-white text-sm tracking-tight">Atur Pintar</span>
      </div>
      <div className="hidden sm:flex items-center gap-6 ml-10">
        <button onClick={() => howRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Fitur</button>
        <button onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Harga</button>
        <Link to="/About" className="text-xs text-white/50 hover:text-white transition-colors">Tentang</Link>
      </div>
      <button onClick={() => navigate("/login")} className="text-xs font-bold bg-[#F97316] hover:bg-[#e05e00] text-white px-4 py-2 rounded-full transition-colors ml-auto">
        Masuk / Daftar
      </button>
    </nav>
  );
}
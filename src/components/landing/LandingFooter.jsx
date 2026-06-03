import { Link } from "react-router-dom";
import { Mail, Instagram, Facebook } from "lucide-react";
import { TikTokIcon, ThreadsIcon } from "./SocialIcons";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/5 pt-10 pb-8 px-5 sm:px-12 lg:px-20 relative z-10 mt-16">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo Atur Pintar" width="24" height="24" loading="lazy" className="w-6 h-6" />
              <span className="text-sm font-black text-white">Atur Pintar</span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed italic">"Duit diatur, hidup lebih pintar."</p>
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Tautan</p>
            <div className="space-y-2">
              <div><Link to="/PrivacyPolicy" className="text-white/30 hover:text-white/70 text-xs transition-colors">Privacy Policy</Link></div>
              <div><Link to="/TermsOfService" className="text-white/30 hover:text-white/70 text-xs transition-colors">Terms of Service</Link></div>
              <div><a href="mailto:admin@aturpintar.id" className="text-white/30 hover:text-white/70 text-xs transition-colors">Hubungi Kami</a></div>
            </div>
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Kontak</p>
            <a href="mailto:admin@aturpintar.id" className="flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors mb-3">
              <Mail className="w-3.5 h-3.5" />
              admin@aturpintar.id
            </a>
            <p className="text-white/20 text-[11px]">aturpintar.id</p>
            <div className="flex items-center gap-3 mt-3">
              <a href="https://instagram.com/aturpintar" target="_blank" rel="noopener noreferrer" aria-label="Instagram Atur Pintar" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="https://tiktok.com/@aturpintar.id" target="_blank" rel="noopener noreferrer" aria-label="TikTok Atur Pintar" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                <TikTokIcon />
              </a>
              <a href="https://facebook.com/aturpintar" target="_blank" rel="noopener noreferrer" aria-label="Facebook Page Atur Pintar" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="https://threads.net/@aturpintar" target="_blank" rel="noopener noreferrer" aria-label="Threads Atur Pintar" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                <ThreadsIcon />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-5">
          <p className="text-white/20 text-xs text-center">© 2026 PT Rideff Vreka Tech. All rights reserved. · admin@aturpintar.id · aturpintar.id</p>
        </div>
      </div>
    </footer>
  );
}
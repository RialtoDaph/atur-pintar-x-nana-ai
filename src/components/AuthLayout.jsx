import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/LandingPage" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <img
              src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png"
              alt="Logo Atur Pintar"
              className="w-9 h-9"
            />
            <span className="font-black text-white text-lg tracking-tight">Atur Pintar</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-white/50 text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-white/50 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
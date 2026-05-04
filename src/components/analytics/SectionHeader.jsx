import React from "react";

export default function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2 pb-1">
      <span className="text-lg">{emoji}</span>
      <div>
        <h2 className="text-[#1A1A1A] font-bold text-sm sm:text-base leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-[#8FA4C8] mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";

export default function DateRangeFilter({ onFilterChange, defaultPeriod = "6" }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    setShowCustom(false);
    onFilterChange({ type: "period", value });
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onFilterChange({
        type: "custom",
        startDate: customStart,
        endDate: customEnd,
      });
    }
  };

  const periodOptions = [
    { label: "3M", value: "3" },
    { label: "6M", value: "6" },
    { label: "12M", value: "12" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {periodOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            if (opt.value === "custom") {
              setShowCustom(true);
              setPeriod("custom");
            } else {
              handlePeriodChange(opt.value);
            }
          }}
          className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            period === opt.value
              ? "bg-[#FF6A00] text-white"
              : "bg-[#F2F4F7] text-[#0A0A0A] hover:bg-[#E2E8F0]"
          }`}
        >
          {opt.label}
        </button>
      ))}

      {/* Custom Date Range Popover */}
      {showCustom && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg p-3 shadow-lg border border-[#E2E8F0] z-10 flex gap-2 flex-col sm:flex-row">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[#F2F4F7] text-[#0A0A0A] text-xs border border-[#E2E8F0] focus:outline-none focus:border-[#FF6A00]"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[#F2F4F7] text-[#0A0A0A] text-xs border border-[#E2E8F0] focus:outline-none focus:border-[#FF6A00]"
          />
          <button
            onClick={handleCustomRange}
            disabled={!customStart || !customEnd}
            className="px-2.5 py-1 rounded-lg bg-[#FF6A00] text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Terapkan
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="px-2.5 py-1 rounded-lg bg-[#F2F4F7] text-[#0A0A0A] text-xs font-medium"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
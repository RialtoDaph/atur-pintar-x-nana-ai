import { useState, useRef } from "react";
import { Calendar } from "lucide-react";

export default function DateInput({ value, onChange, label, required = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const handlePickerChange = (e) => {
    const newDate = e.target.value;
    onChange(newDate);
    setShowPicker(false);
  };

  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] flex items-center gap-2 justify-between tap-highlight-fix"
          >
            <span>{value ? formatDate(value) : "Pilih tanggal"}</span>
            <Calendar className="w-4 h-4 text-[#8FA4C8] flex-shrink-0" />
          </button>

        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={handlePickerChange}
          className="hidden"
          required={required}
        />
      </div>


    </div>
  );
}
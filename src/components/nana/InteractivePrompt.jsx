import { useState } from "react";
import { ChevronRight } from "lucide-react";

/**
 * Renders interactive UI elements based on agent's interactive_prompt
 * Supported types: select_one, select_multiple, text_input, confirm
 */
export default function InteractivePrompt({ prompt, onResponse }) {
  const [selectedValues, setSelectedValues] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!prompt) return null;

  const handleSelectOne = (value) => {
    handleSubmit(value);
  };

  const handleSelectMultiple = (value) => {
    const updated = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(updated);
  };

  const handleSubmit = async (value) => {
    setSubmitting(true);
    const response = value || inputValue;
    
    // Format response message based on type
    let displayText = "";
    if (prompt.type === "select_one" || prompt.type === "select_multiple") {
      const selected = prompt.options.filter((o) =>
        prompt.type === "select_one"
          ? o.value === value
          : selectedValues.includes(o.value)
      );
      displayText = selected.map((s) => s.label).join(", ");
    } else if (prompt.type === "text_input") {
      displayText = response;
    } else if (prompt.type === "confirm") {
      displayText = value === "yes" ? "Ya" : "Tidak";
    }

    await onResponse(displayText, response);
    setSubmitting(false);
  };

  return (
    <div className="mt-3 space-y-2">
      {prompt.question && (
        <p className="text-xs text-[#8FA4C8] font-medium">{prompt.question}</p>
      )}

      {prompt.type === "select_one" && (
        <div className="space-y-1.5">
          {prompt.options?.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectOne(option.value)}
              disabled={submitting}
              className="w-full text-left text-xs bg-[#F2F4F7] dark:bg-[#2D2D2D] border border-[#E2E8F0] dark:border-[#3D3D3D] rounded-lg px-3 py-2 text-[#1A1A1A] dark:text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors disabled:opacity-50 flex items-center justify-between group"
            >
              <span>{option.label}</span>
              <ChevronRight className="w-3 h-3 text-[#8FA4C8] group-hover:text-[#FF6A00] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {prompt.type === "select_multiple" && (
        <div className="space-y-1.5">
          {prompt.options?.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-xs bg-[#F2F4F7] dark:bg-[#2D2D2D] border border-[#E2E8F0] dark:border-[#3D3D3D] rounded-lg px-3 py-2 cursor-pointer hover:border-[#FF6A00] transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleSelectMultiple(option.value)}
                disabled={submitting}
                className="w-3 h-3 rounded border-[#E2E8F0] dark:border-[#3D3D3D] accent-[#FF6A00] cursor-pointer"
              />
              <span className="text-[#1A1A1A] dark:text-white flex-1">{option.label}</span>
            </label>
          ))}
          <button
            onClick={() => handleSubmit()}
            disabled={submitting || selectedValues.length === 0}
            className="w-full text-xs bg-[#FF6A00] text-white rounded-lg px-3 py-2 hover:bg-[#e05e00] transition-colors disabled:opacity-50 font-medium mt-2"
          >
            {submitting ? "Menyimpan..." : "Konfirmasi"}
          </button>
        </div>
      )}

      {prompt.type === "text_input" && (
        <div className="space-y-1.5">
          <input
            type={prompt.input_type || "text"}
            placeholder={prompt.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={submitting}
            className="w-full text-xs bg-[#F2F4F7] dark:bg-[#2D2D2D] border border-[#E2E8F0] dark:border-[#3D3D3D] rounded-lg px-3 py-2 text-[#1A1A1A] dark:text-white placeholder:text-[#8FA4C8] focus:outline-none focus:border-[#FF6A00] disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={submitting || !inputValue.trim()}
            className="w-full text-xs bg-[#FF6A00] text-white rounded-lg px-3 py-2 hover:bg-[#e05e00] transition-colors disabled:opacity-50 font-medium"
          >
            {submitting ? "Menyimpan..." : "Lanjut"}
          </button>
        </div>
      )}

      {prompt.type === "confirm" && (
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit("yes")}
            disabled={submitting}
            className="flex-1 text-xs bg-[#FF6A00] text-white rounded-lg px-3 py-2 hover:bg-[#e05e00] transition-colors disabled:opacity-50 font-medium"
          >
            Ya
          </button>
          <button
            onClick={() => handleSubmit("no")}
            disabled={submitting}
            className="flex-1 text-xs bg-[#F2F4F7] dark:bg-[#2D2D2D] border border-[#E2E8F0] dark:border-[#3D3D3D] text-[#1A1A1A] dark:text-white rounded-lg px-3 py-2 hover:border-[#FF6A00] transition-colors disabled:opacity-50 font-medium"
          >
            Tidak
          </button>
        </div>
      )}
    </div>
  );
}
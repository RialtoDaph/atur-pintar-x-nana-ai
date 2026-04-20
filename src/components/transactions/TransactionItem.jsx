import { useState, useRef } from "react";
import { Pencil, Trash2, Repeat2, Target, CheckSquare, Square } from "lucide-react";

export default function TransactionItem({ tx, cat, linkedGoal, selectMode, selected, onSelect, onEdit, onDelete, formatCurrency, locale }) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(null);
  const isIncome = tx.type === "income";

  function onTouchStart(e) {
    if (selectMode) return;
    startX.current = e.touches[0].clientX;
    setSwiping(false);
  }

  function onTouchMove(e) {
    if (startX.current === null || selectMode) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) {
      setSwiping(true);
      setSwipeX(Math.max(dx, -88));
    } else if (swiping) {
      setSwipeX(Math.min(0, swipeX + (e.touches[0].clientX - startX.current)));
    }
  }

  function onTouchEnd() {
    if (swipeX < -44) {
      setSwipeX(-88);
    } else {
      setSwipeX(0);
      setSwiping(false);
    }
    startX.current = null;
  }

  function handleTap() {
    if (selectMode) { onSelect(); return; }
    if (swipeX !== 0) { setSwipeX(0); }
  }

  return (
    <div className="relative overflow-hidden border-b border-[#F2F4F7] last:border-b-0">
      {/* Action buttons revealed on swipe */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center" style={{ width: 88 }}>
        <button
          onClick={() => { setSwipeX(0); onEdit(); }}
          className="w-11 h-full flex items-center justify-center bg-[#4F7CFF] tap-highlight-fix"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => { setSwipeX(0); onDelete(); }}
          className="w-11 h-full flex items-center justify-center bg-[#FF6B6B] tap-highlight-fix"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main row */}
      <div
        className={`flex items-center gap-3 px-4 py-3 bg-white transition-transform duration-150 ${selectMode ? "cursor-pointer" : ""} ${selected ? "bg-[#FF6A00]/5" : ""}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleTap}
      >
        {selectMode && (
          <div className="flex-shrink-0">
            {selected ? <CheckSquare className="w-4 h-4 text-[#FF6A00]" /> : <Square className="w-4 h-4 text-[#CBD5E0]" />}
          </div>
        )}

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: (cat.color || "#888") + "18" }}
        >
          {cat.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{tx.note || cat.label}</p>
            {tx.is_recurring && <Repeat2 className="w-3 h-3 text-[#4F7CFF] flex-shrink-0" />}
            {linkedGoal && <Target className="w-3 h-3 text-[#FF6A00] flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-[#8FA4C8] mt-0.5">
            {new Date(tx.date).toLocaleDateString(locale, { month: "short", day: "numeric" })} · {cat.label}
          </p>
        </div>

        <span
          className="text-sm font-bold flex-shrink-0"
          style={{ color: tx.type === "income" ? "#22C55E" : tx.type === "savings" ? "#3B82F6" : "#EF4444" }}
        >
          {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
        </span>

        {/* Desktop-only action buttons */}
        {!selectMode && (
          <div className="hidden sm:flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[#CBD5E0] hover:text-[#4F7CFF] p-1.5 tap-highlight-fix">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-[#CBD5E0] hover:text-[#FF6B6B] p-1.5 tap-highlight-fix">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
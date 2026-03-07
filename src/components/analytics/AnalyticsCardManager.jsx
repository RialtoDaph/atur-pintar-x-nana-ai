import { useState } from "react";
import { X, GripVertical, Eye, EyeOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const ALL_CARDS = [
  { id: "daily_spending", label: "Pengeluaran Harian", emoji: "📊" },
  { id: "restaurant_bar", label: "Restaurant & Bar", emoji: "🍽️" },
  { id: "income_expense_chart", label: "Grafik Pemasukan vs Pengeluaran", emoji: "📈" },
  { id: "spending_trend", label: "Tren Pengeluaran", emoji: "📉" },
  { id: "category_breakdown", label: "Kategori Pengeluaran", emoji: "🥧" },
  { id: "budget_chart", label: "Anggaran vs Pengeluaran", emoji: "💰" },
  { id: "goals_progress", label: "Progress Tujuan", emoji: "🎯" },
  { id: "investments", label: "Investasi", emoji: "📦" },
];

export default function AnalyticsCardManager({ cards, onSave, onClose }) {
  const [localCards, setLocalCards] = useState(() => {
    if (cards && cards.length > 0) return cards;
    return ALL_CARDS.map(c => ({ id: c.id, visible: true }));
  });

  const getCardInfo = (id) => ALL_CARDS.find(c => c.id === id) || { id, label: id, emoji: "📋" };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newCards = Array.from(localCards);
    const [moved] = newCards.splice(result.source.index, 1);
    newCards.splice(result.destination.index, 0, moved);
    setLocalCards(newCards);
  };

  const toggleVisibility = (id) => {
    setLocalCards(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const handleSave = () => {
    onSave(localCards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F4F7]">
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">Kelola Kartu Analitik</h2>
            <p className="text-xs text-[#8FA4C8] mt-0.5">Aktifkan, nonaktifkan, atau susun kartu</p>
          </div>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag List */}
        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="analytics-cards">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {localCards.map((card, idx) => {
                    const info = getCardInfo(card.id);
                    return (
                      <Draggable key={card.id} draggableId={card.id} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              snapshot.isDragging
                                ? "shadow-lg border-[#FF6A00] bg-[#FF6A00]/5"
                                : card.visible
                                ? "border-[#E2E8F0] bg-white"
                                : "border-[#E2E8F0] bg-[#F8FAFC] opacity-60"
                            }`}
                          >
                            {/* Drag handle */}
                            <div {...provided.dragHandleProps} className="text-[#CBD5E0] cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Emoji */}
                            <span className="text-lg flex-shrink-0">{info.emoji}</span>

                            {/* Label */}
                            <span className={`text-sm font-medium flex-1 ${card.visible ? "text-[#0A0A0A]" : "text-[#8FA4C8] line-through"}`}>
                              {info.label}
                            </span>

                            {/* Toggle */}
                            <button
                              onClick={() => toggleVisibility(card.id)}
                              className={`flex-shrink-0 transition-colors ${card.visible ? "text-[#00C9A7]" : "text-[#CBD5E0]"}`}
                            >
                              {card.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F2F4F7] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:border-[#CBD5E0] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[#0A0A0A] text-sm font-semibold text-white hover:bg-[#333] transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_CATEGORIES = {
  expense: [
    { key: "housing", i18nKey: "cat_housing", emoji: "🏠", color: "#4F7CFF" },
    { key: "food", i18nKey: "cat_food", emoji: "🍔", color: "#00C9A7" },
    { key: "transport", i18nKey: "cat_transport", emoji: "🚗", color: "#F5A623" },
    { key: "health", i18nKey: "cat_health", emoji: "❤️", color: "#FF6B6B" },
    { key: "entertainment", i18nKey: "cat_entertainment", emoji: "🎬", color: "#9B59B6" },
    { key: "shopping", i18nKey: "cat_shopping", emoji: "🛍️", color: "#E91E8C" },
    { key: "subscriptions", i18nKey: "cat_subscriptions", emoji: "📱", color: "#1ABC9C" },
    { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#95A5A6" },
  ],
  income: [
    { key: "salary", i18nKey: "cat_salary", emoji: "💼", color: "#27AE60" },
    { key: "freelance", i18nKey: "cat_freelance", emoji: "💻", color: "#2ECC71" },
    { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#95A5A6" },
  ],
};

export default function TransactionCategories({ tab, form, setForm, onShowSubCatPopup }) {
  const { t } = useAppSettings();
  const [customCats, setCustomCats] = useState([]);
  const [catOrder, setCatOrder] = useState([]);
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    loadCustomCats();
    loadAppSettings();
    
    const unsubscribe = base44.entities.CustomCategory.subscribe(() => {
      loadCustomCats();
    });
    
    return () => unsubscribe();
  }, []);

  async function loadAppSettings() {
    try {
      const settings = await base44.entities.AppSettings.list();
      if (settings.length > 0) {
        setAppSettings(settings[0]);
        setCatOrder(settings[0].category_order || []);
      }
    } catch (error) {
      console.error("Failed to load app settings:", error);
    }
  }

  async function loadCustomCats() {
    try {
      const cats = await base44.entities.CustomCategory.list("-created_date");
      setCustomCats(cats);
    } catch (error) {
      console.error("Failed to load custom categories:", error);
    }
  }

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    
    const newOrder = Array.from(orderedCats);
    const [moved] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, moved);
    const newOrderKeys = newOrder.map(c => c.key);
    setCatOrder(newOrderKeys);
    
    if (appSettings) {
      try {
        await base44.entities.AppSettings.update(appSettings.id, { category_order: newOrderKeys });
      } catch (error) {
        console.error("Failed to update category order:", error);
      }
    }
  };

  const defaultCats = DEFAULT_CATEGORIES[tab] || [];
  const filteredCustom = customCats.filter(c => c.type === tab || c.type === "both");
  const allCats = [
    ...defaultCats.map(c => ({ ...c, label: t(c.i18nKey) })),
    ...filteredCustom.map(c => ({ key: `custom_${c.id}`, label: c.name, emoji: c.emoji, color: c.color || "#888", parent_category_key: c.parent_category_key })),
  ];
  
  const mainCats = allCats.filter(c => !c.parent_category_key);
  const subCatsByParent = {};
  allCats.filter(c => c.parent_category_key).forEach(c => {
    if (!subCatsByParent[c.parent_category_key]) subCatsByParent[c.parent_category_key] = [];
    subCatsByParent[c.parent_category_key].push(c);
  });
  
  const orderedCats = catOrder.length > 0 
    ? catOrder.map(key => mainCats.find(c => c.key === key)).filter(Boolean)
    : mainCats;
  
  const handleCategoryClick = (cat) => {
    const subs = subCatsByParent[cat.key];
    if (subs && subs.length > 0) {
      onShowSubCatPopup({ parentKey: cat.key, parentLabel: cat.label, parentEmoji: cat.emoji, subs });
    } else {
      setForm({ ...form, category: cat.key });
    }
  };

  return (
    <div className="mb-5">
      <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('category')}</label>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-[#FF6A00]/5" : ""}`}
            >
              {orderedCats.map((c, idx) => (
                <Draggable key={c.key} draggableId={c.key} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative transition-all ${snapshot.isDragging ? "opacity-50" : ""}`}
                    >
                      <button
                        {...provided.dragHandleProps}
                        onClick={() => handleCategoryClick(c)}
                        className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl border transition-all relative ${
                          form.category === c.key || subCatsByParent[c.key]?.some(s => s.key === form.category)
                            ? "border-[#FF6A00] bg-[#FF6A00]/10"
                            : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
                        }`}
                      >
                        <span className="text-lg sm:text-xl">{c.emoji}</span>
                        <span className="text-[9px] sm:text-[10px] font-medium text-[#4A5568] text-center leading-tight">{c.label}</span>
                        {subCatsByParent[c.key]?.length > 0 && (
                          <span className="absolute top-1 right-1 w-3 h-3 bg-[#FF6A00] rounded-full flex items-center justify-center">
                            <span className="text-white text-[7px] font-bold">▾</span>
                          </span>
                        )}
                        {subCatsByParent[c.key]?.some(s => s.key === form.category) && (
                          <span className="text-[8px] text-[#FF6A00] font-semibold truncate w-full text-center">
                            {subCatsByParent[c.key].find(s => s.key === form.category)?.emoji}{" "}
                            {subCatsByParent[c.key].find(s => s.key === form.category)?.label}
                          </span>
                        )}
                      </button>
                      {snapshot.isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                          <GripVertical className="w-4 h-4 text-[#FF6A00]" />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_CATEGORIES, BUILTIN_SUBCATEGORIES, CATEGORY_KEYWORDS } from "./categoryConfig";
import { useAppSettings } from "./useAppSettings";

/**
 * Centralized hook for category & transaction management
 * Used by both AddTransactionModal and NanaChatBoxInline
 */
export function useCategoryManager() {
  const { t } = useAppSettings();
  const [customCats, setCustomCats] = useState([]);
  const [allCatsMap, setAllCatsMap] = useState({});
  const [subCatsByParent, setSubCatsByParent] = useState({});

  // Load custom + global categories
  useEffect(() => {
    loadAllCats();
    const unsubscribe = base44.entities.CustomCategory.subscribe(() => {
      loadAllCats();
    });
    return () => unsubscribe();
  }, []);

  async function loadAllCats() {
    try {
      const [customCatsData, globalCatsData] = await Promise.all([
        base44.entities.CustomCategory.list("-created_date"),
        base44.entities.GlobalCategory.list(),
      ]);
      setCustomCats(customCatsData);
      buildCategoryMaps(customCatsData, globalCatsData);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  function buildCategoryMaps(cats, globalCats = []) {
    const allCats = {};
    const subCats = {};

    // 1. Lowest priority: built-in static DEFAULT_CATEGORIES
    [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income].forEach(cat => {
      allCats[cat.key] = { ...cat, label: t(cat.i18nKey) };
    });

    // 2. Mid priority: GlobalCategory from admin (overrides defaults with same key if name matches)
    globalCats.forEach(cat => {
      // GlobalCategories use their own keys prefixed with "global_" to avoid conflicts
      // BUT if they have the same name as a default key, map them to that key
      const matchingDefault = [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income]
        .find(d => d.key === cat.name?.toLowerCase().replace(/\s+/g, "_"));
      const key = matchingDefault ? matchingDefault.key : `global_${cat.id}`;
      allCats[key] = {
        key,
        label: cat.name,
        emoji: cat.emoji,
        color: cat.color || "#95A5A6",
        type: cat.type,
      };
    });

    // 3. Highest priority: user's CustomCategory (always wins)
    cats.forEach(cat => {
      // Check if this custom cat has the same name as an existing category (to avoid duplicates)
      const normalizedName = cat.name?.toLowerCase().replace(/\s+/g, "_");
      const matchingKey = Object.keys(allCats).find(
        k => allCats[k].label?.toLowerCase().replace(/\s+/g, "_") === normalizedName
      );
      const key = matchingKey || `custom_${cat.id}`;
      allCats[key] = {
        key,
        label: cat.name,
        emoji: cat.emoji,
        color: cat.color || "#888",
        parent_category_key: cat.parent_category_key,
      };

      // Build subcategory map
      if (cat.parent_category_key) {
        if (!subCats[cat.parent_category_key]) {
          subCats[cat.parent_category_key] = [];
        }
        subCats[cat.parent_category_key].push(allCats[key]);
      }
    });

    // Add built-in subcategories
    Object.entries(BUILTIN_SUBCATEGORIES).forEach(([parentKey, subs]) => {
      if (!subCats[parentKey]) {
        subCats[parentKey] = [];
      }
      subCats[parentKey].push(
        ...subs.map(sub => ({
          key: sub.key,
          label: sub.label,
          emoji: sub.emoji,
        }))
      );
    });

    setAllCatsMap(allCats);
    setSubCatsByParent(subCats);
  }

  /**
   * Get category object by key
   * Flattens the nested DEFAULT_CATEGORIES structure
   */
  const getCategoryByKey = useCallback((key) => {
    if (!key) return null;
    return allCatsMap[key] || null;
  }, [allCatsMap]);

  /**
   * Detect category from text using keywords
   */
  const detectCategory = useCallback((text) => {
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) return cat;
    }
    return null;
  }, []);

  /**
   * Parse transaction from natural language text
   * Returns { amount, note, type, category } or null
   */
  const parseTransaction = useCallback((text) => {
    const amountRegex = /(\d[\d.,]*)\s*(ribu|rb|k|juta|jt|miliar|mil)?\b/gi;
    const matches = [...text.matchAll(amountRegex)];
    let amount = null;
    let amountStr = null;

    for (const m of matches) {
      const num = parseFloat(m[1].replace(/\./g, "").replace(/,/g, "."));
      const suffix = (m[2] || "").toLowerCase();
      let value = num;

      if (["ribu", "rb", "k"].includes(suffix)) value = num * 1000;
      else if (["juta", "jt"].includes(suffix)) value = num * 1000000;
      else if (["miliar", "mil"].includes(suffix)) value = num * 1000000000;

      if (value >= 100) {
        amount = value;
        amountStr = m[0];
        break;
      }
    }

    if (!amount) return null;

    const note = text.replace(amountStr, "").trim().replace(/\s+/g, " ") || "Transaksi";
    const incomeKW = ["terima", "dapat", "gaji", "masuk", "income", "pemasukan", "salary"];
    const isIncome = incomeKW.some((kw) => text.toLowerCase().includes(kw));
    const category = detectCategory(text);

    return { amount, note, type: isIncome ? "income" : "expense", category };
  }, [detectCategory]);

  /**
   * Learn from user's manual category selection (localStorage)
   */
  const learnCategory = useCallback((note, category) => {
    if (!note || !category) return;
    const key = "cat_history";
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    // Store last 5 words normalized as key
    const normalized = note.toLowerCase().trim().split(/\s+/).slice(0, 5).join(" ");
    existing[normalized] = category;
    // Keep only last 200 entries
    const entries = Object.entries(existing);
    if (entries.length > 200) entries.splice(0, entries.length - 200);
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(entries)));
  }, []);

  /**
   * Suggest category from history (localStorage) based on similar past notes
   */
  const suggestFromHistory = useCallback((note) => {
    if (!note) return null;
    const key = "cat_history";
    const history = JSON.parse(localStorage.getItem(key) || "{}");
    const noteLower = note.toLowerCase().trim();
    // Exact prefix match first
    for (const [pastNote, category] of Object.entries(history)) {
      if (noteLower.startsWith(pastNote) || pastNote.startsWith(noteLower)) return category;
    }
    // Fuzzy: check if any word from note matches past note
    const words = noteLower.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      for (const [pastNote, category] of Object.entries(history)) {
        if (pastNote.includes(word)) return category;
      }
    }
    return null;
  }, []);

  /**
   * Create transaction in database
   */
  const createTransaction = useCallback(async (txData) => {
    return base44.entities.Transaction.create({
      amount: txData.amount,
      type: txData.type,
      category: txData.category || "other",
      note: txData.note,
      date: txData.date || new Date().toISOString().split("T")[0],
      is_recurring: txData.is_recurring || false,
      recurring_interval: txData.recurring_interval,
      recurring_last_generated: txData.recurring_last_generated,
      goal_id: txData.goal_id,
    });
  }, []);

  /**
   * Get formatted category display (emoji + label)
   */
  const formatCategory = useCallback((categoryKey) => {
    const cat = getCategoryByKey(categoryKey);
    if (!cat) return { emoji: "📦", label: categoryKey };
    return {
      emoji: cat.emoji || "📦",
      label: cat.label || categoryKey,
    };
  }, [getCategoryByKey]);

  return {
    customCats,
    allCatsMap,
    subCatsByParent,
    getCategoryByKey,
    detectCategory,
    parseTransaction,
    createTransaction,
    formatCategory,
    learnCategory,
    suggestFromHistory,
    loadCustomCats: loadAllCats,
  };
}
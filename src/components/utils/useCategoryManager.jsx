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

  // Load custom categories
  useEffect(() => {
    loadCustomCats();
    const unsubscribe = base44.entities.CustomCategory.subscribe(() => {
      loadCustomCats();
    });
    return () => unsubscribe();
  }, []);

  async function loadCustomCats() {
    try {
      const cats = await base44.entities.CustomCategory.list("-created_date");
      setCustomCats(cats);
      buildCategoryMaps(cats);
    } catch (error) {
      console.error("Failed to load custom categories:", error);
    }
  }

  function buildCategoryMaps(cats) {
    const allCats = {};
    const subCats = {};

    // Add all default categories
    [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income].forEach(cat => {
      allCats[cat.key] = { ...cat, label: t(cat.i18nKey) };
    });

    // Add custom categories
    cats.forEach(cat => {
      const key = `custom_${cat.id}`;
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
    loadCustomCats,
  };
}
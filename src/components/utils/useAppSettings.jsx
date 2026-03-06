import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  language: 'id',
  currency: 'IDR',
  currency_symbol: 'Rp',
  decimal_separator: ',',
  thousand_separator: '.',
  date_format: 'DD/MM/YYYY',
};

const TRANSLATIONS = {
  id: {
    expense: 'Pengeluaran',
    income: 'Pemasukan',
    savings: 'Tabungan',
    add_transaction: 'Tambah Transaksi',
    add_investment: 'Tambah Investasi',
    edit_investment: 'Edit Investasi',
    total_portfolio: 'Total Nilai Portofolio',
    savings_goal: 'Tujuan Tabungan',
    monthly_budget: 'Anggaran Bulanan',
    profit_loss: 'Keuntungan/Rugi',
    current_value: 'Nilai Saat Ini',
    initial_amount: 'Modal Awal',
    profit_percent: 'Persen Profit',
  },
  en: {
    expense: 'Expense',
    income: 'Income',
    savings: 'Savings',
    add_transaction: 'Add Transaction',
    add_investment: 'Add Investment',
    edit_investment: 'Edit Investment',
    total_portfolio: 'Total Portfolio Value',
    savings_goal: 'Savings Goal',
    monthly_budget: 'Monthly Budget',
    profit_loss: 'Profit/Loss',
    current_value: 'Current Value',
    initial_amount: 'Initial Amount',
    profit_percent: 'Profit %',
  },
};

export function useAppSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.settings_id) {
          const newSettings = await base44.entities.AppSettings.create(DEFAULT_SETTINGS);
          await base44.auth.updateMe({ settings_id: newSettings.id });
          setSettings(newSettings);
          setSettingsId(newSettings.id);
        } else {
          const appSettings = await base44.entities.AppSettings.list();
          const userSettings = appSettings.find(s => s.id === user.settings_id);
          if (userSettings) {
            setSettings(userSettings);
            setSettingsId(userSettings.id);
          }
        }
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await base44.entities.AppSettings.update(settingsId, newSettings);
    }
  };

  const t = (key) => TRANSLATIONS[settings.language]?.[key] || key;

  const formatCurrency = (value) => {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    const formatted = Math.abs(value).toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${settings.currency_symbol} ${formatted}`;
  };

  const formatNumber = (value, decimals = 0) => {
    if (typeof value !== 'number') value = parseFloat(value) || 0;
    return value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return { settings, setSettings, updateSettings, loading, t, formatCurrency, formatNumber };
}
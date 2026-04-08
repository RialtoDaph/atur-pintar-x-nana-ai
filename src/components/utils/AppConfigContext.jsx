import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AppConfigContext = createContext();

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const records = await base44.asServiceRole.entities.AppConfig.list();
        setConfig(records?.[0] || getDefaults());
      } catch (error) {
        console.error('Error loading AppConfig:', error);
        setConfig(getDefaults());
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, loading }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    return { config: getDefaults(), loading: false };
  }
  return context;
}

function getDefaults() {
  return {
    feature_split_bill: true,
    feature_shared_wallet: true,
    feature_investment: true,
    feature_nana_ai: true,
    feature_gamification: true,
    feature_waiting_list: true,
    maintenance_mode: false,
    premium_price_monthly: 49000,
    premium_price_yearly: 490000,
    app_name: 'Atur Pintar'
  };
}
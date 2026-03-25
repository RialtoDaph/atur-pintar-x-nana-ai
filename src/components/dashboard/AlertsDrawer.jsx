import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DashboardInsights from "@/components/dashboard/DashboardInsights";
import SmartAlertsPanel from "@/components/dashboard/SmartAlertsPanel";
import { AnimatePresence, motion } from "framer-motion";

export default function AlertsDrawer({ onClose, user }) {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.Transaction.filter({ created_by: user.email }, "-date", 100),
      base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
    ]).then(([tx, gl]) => {
      setTransactions(tx);
      setGoals(gl);
      setLoading(false);
    });
  }, [user?.email]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm h-full bg-[#F2F4F7] overflow-y-auto flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#0A0A0A] sticky top-0 z-10">
            <div>
              <p className="text-white font-bold text-sm">Insights & Alerts</p>
              <p className="text-[#8FA4C8] text-xs mt-0.5">Ringkasan keuangan kamu</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors tap-highlight-fix"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : (
              <>
                <SmartAlertsPanel user={user} />
                <DashboardInsights transactions={transactions} goals={goals} />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
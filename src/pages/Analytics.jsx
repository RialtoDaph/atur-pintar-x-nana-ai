import React from "react";
import PremiumGate from "@/components/premium/PremiumGate";

export default function AnalyticsPage() {
  return (
    <PremiumGate>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analitik Keuangan</h1>
      </div>
    </PremiumGate>
  );
}
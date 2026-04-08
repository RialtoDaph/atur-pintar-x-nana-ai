import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState("");

  const runDataCleanup = async () => {
    if (!window.confirm("Run FULL data cleanup? This will delete simulation data, duplicates, and pending payments.")) return;
    setCleaning(true);
    try {
      const res = await base44.functions.invoke('adminDataCleanup', {});
      setCleanupMsg(res.data.message || "Cleanup completed");
      setTimeout(() => setCleanupMsg(""), 3000);
    } catch (error) {
      setCleanupMsg("Error: " + error.message);
    }
    setCleaning(false);
  };

  useEffect(() => {
    navigate(createPageUrl("AdminUsers"));
  }, [navigate]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Admin Control Panel</h1>
      {cleanupMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ {cleanupMsg}
        </div>
      )}
      <button
        onClick={runDataCleanup}
        disabled={cleaning}
        className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-60"
      >
        {cleaning ? "Running Cleanup..." : "Run Data Cleanup"}
      </button>
    </div>
  );
}
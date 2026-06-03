import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/hooks/useHaptic";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const hapticFired = useRef(false);
  const THRESHOLD = 70;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      const next = Math.min(delta * 0.5, THRESHOLD + 20);
      setPullDistance(next);
      // Fire haptic once when crossing threshold (signals "release to refresh")
      if (next >= THRESHOLD && !hapticFired.current) {
        haptic.light();
        hapticFired.current = true;
      } else if (next < THRESHOLD && hapticFired.current) {
        hapticFired.current = false;
      }
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
    hapticFired.current = false;
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: "relative" }}
    >
      {/* Pull indicator */}
      <div
        style={{
          height: pullDistance > 0 || refreshing ? (refreshing ? THRESHOLD : pullDistance) : 0,
          overflow: "hidden",
          transition: pullDistance === 0 ? "height 0.3s ease" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity: progress,
            transform: `rotate(${progress * 360}deg)`,
            transition: refreshing ? "transform 0.8s linear infinite" : "none",
            animation: refreshing ? "spin 0.8s linear infinite" : "none",
          }}
          className="text-[#FF6A00]"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </div>
      </div>
      {children}
    </div>
  );
}
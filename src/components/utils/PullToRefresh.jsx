import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/hooks/useHaptic";

/**
 * Pull-to-refresh gesture wrapper.
 *
 * Only starts a pull sequence when the nearest scrollable ancestor is at scrollTop === 0.
 * This prevents conflicts with:
 *   - Native iOS WebView vertical scrolling (rubber-band + momentum)
 *   - Horizontal swipe-back / carousel gestures
 *   - Modal/drawer sheets that own their own scroll context
 *
 * The gesture is armed on touchstart (only if scrollTop is exactly 0) and disarmed
 * as soon as the finger moves upward or a horizontal drag dominates.
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const startX = useRef(null);
  const armed = useRef(false);
  const hapticFired = useRef(false);
  const rootRef = useRef(null);
  const THRESHOLD = 70;

  // Walk up from the touch target and find the closest ancestor that actually scrolls
  // vertically. Falls back to document.scrollingElement / window for pages that scroll
  // the whole viewport.
  const getScrollContainer = (el) => {
    let node = el;
    while (node && node !== document.body) {
      if (node instanceof HTMLElement) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const canScroll = (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")
          && node.scrollHeight > node.clientHeight;
        if (canScroll) return node;
      }
      node = node.parentNode;
    }
    return document.scrollingElement || document.documentElement;
  };

  const getScrollTop = (container) => {
    if (!container) return window.scrollY || 0;
    if (container === document.scrollingElement || container === document.documentElement) {
      return window.scrollY || 0;
    }
    return container.scrollTop || 0;
  };

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    const touch = e.touches[0];
    const container = getScrollContainer(e.target);
    // ONLY arm the gesture when the parent scroll context is exactly at the top.
    // Any non-zero scrollTop means the user is mid-scroll — leave the touch to native.
    if (getScrollTop(container) !== 0) {
      armed.current = false;
      startY.current = null;
      startX.current = null;
      return;
    }
    armed.current = true;
    startY.current = touch.clientY;
    startX.current = touch.clientX;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!armed.current || startY.current === null || refreshing) return;
    const touch = e.touches[0];
    const dy = touch.clientY - startY.current;
    const dx = touch.clientX - startX.current;

    // Disarm on upward drag or horizontal-dominant gesture (swipe-back, carousels).
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
      if (pullDistance !== 0) setPullDistance(0);
      armed.current = false;
      return;
    }

    // Only preventDefault while we're actively pulling — keeps native scrolling intact elsewhere.
    if (e.cancelable) e.preventDefault();
    const next = Math.min(dy * 0.5, THRESHOLD + 20);
    setPullDistance(next);
    if (next >= THRESHOLD && !hapticFired.current) {
      haptic.light();
      hapticFired.current = true;
    } else if (next < THRESHOLD && hapticFired.current) {
      hapticFired.current = false;
    }
  }, [refreshing, pullDistance]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
    startX.current = null;
    armed.current = false;
    hapticFired.current = false;
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={rootRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
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
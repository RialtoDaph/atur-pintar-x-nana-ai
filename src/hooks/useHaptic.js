/**
 * Lightweight haptic feedback utility.
 * Uses navigator.vibrate (Android Chrome). Safari iOS doesn't support it —
 * gracefully no-ops without errors.
 *
 * Usage:
 *   import { haptic } from "@/hooks/useHaptic";
 *   haptic.light();   // 10ms — tap
 *   haptic.medium();  // 20ms — confirm
 *   haptic.success(); // [10,40,20] — pattern
 */

const supports = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const vibrate = (pattern) => {
  if (!supports()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw on user-gesture restrictions — silently ignore
  }
};

export const haptic = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate(35),
  success: () => vibrate([10, 40, 20]),
  warning: () => vibrate([30, 50, 30]),
  error: () => vibrate([50, 30, 50, 30, 50]),
};

export default haptic;
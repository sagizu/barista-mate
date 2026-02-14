/**
 * Smart Dial-In logic:
 * - Ratio = Yield / Dose (display only)
 * - Target window is based on Roast Level (user preference):
 *   - Dark: 30–35s
 *   - Medium: 25–30s
 *   - Light: 20–28s
 */

export type DialInFeedback = "perfect" | "too_fast" | "too_slow";

export type RoastLevel = "light" | "medium" | "dark";

const ROAST_WINDOWS: Record<RoastLevel, { min: number; max: number }> = {
  light: { min: 20, max: 28 },
  medium: { min: 25, max: 30 },
  dark: { min: 30, max: 35 },
};

export interface DialInResult {
  ratio: number;
  targetMin: number;
  targetMax: number;
  feedback: DialInFeedback;
  message: string;
  advice: string;
}

export function calculateDialIn(
  dose: number,
  yieldWeight: number,
  time: number,
  roastLevel: RoastLevel = "medium"
): DialInResult | null {
  if (dose <= 0 || time <= 0) return null;
  const ratio = yieldWeight / dose;
  const { min: targetMin, max: targetMax } = ROAST_WINDOWS[roastLevel];

  let feedback: DialInFeedback;
  let message: string;
  let advice: string;

  if (time < targetMin) {
    feedback = "too_fast";
    message = "מהיר מדי! (חוסר חילוץ)";
    advice = "טחן דק יותר.";
  } else if (time > targetMax) {
    feedback = "too_slow";
    message = "איטי מדי! (חילוץ יתר)";
    advice = "טחן גס יותר.";
  } else {
    feedback = "perfect";
    message = "שוט מושלם! 🎯";
    advice = "";
  }

  return {
    ratio,
    targetMin,
    targetMax,
    feedback,
    message,
    advice,
  };
}

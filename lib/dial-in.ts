
/**
 * Smart Dial-In logic:
 * - Ratio = Yield / Dose (display only)
 * - Target window is based on Roast Level (user preference):
 *   - Dark: 30–35s
 *   - Medium: 25–30s
 *   - Light: 20–28s
 */

export type DialInFeedback = "perfect" | "too_fast" | "too_slow";

export type RoastLevel = 1 | 2 | 3 | 4 | 5;

const ROAST_WINDOWS: Record<RoastLevel, { min: number; max: number }> = {
  1: { min: 20, max: 28 }, // Lightest
  2: { min: 22, max: 29 },
  3: { min: 25, max: 30 }, // Medium
  4: { min: 28, max: 33 },
  5: { min: 30, max: 35 }, // Darkest
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
  roastLevel: RoastLevel = 3
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
    advice = "טחן דק יותר ⬆️";
  } else if (time > targetMax) {
    feedback = "too_slow";
    message = "איטי מדי! (חילוץ יתר)";
    advice = "טחן גס יותר ⬇️";
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

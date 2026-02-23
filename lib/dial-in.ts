
/**
 * Smart Dial-In logic:
 * - Ratio = Yield / Dose (display only)
 * - Target window is user-defined (min-max time range)
 */

export type DialInFeedback = "perfect" | "too_fast" | "too_slow";

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
  targetMin: number,
  targetMax: number
): DialInResult | null {
  if (dose <= 0 || time <= 0 || targetMin <= 0 || targetMax <= 0) return null;
  const ratio = yieldWeight / dose;

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

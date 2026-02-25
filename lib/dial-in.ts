
export type DialInFeedback = "perfect" | "good" | "bad";
export type DrinkType = "ristretto" | "espresso" | "lungo";

export interface DialInResult {
  targetTime: number;
  actualTime: number;
  feedback: DialInFeedback;
  message: string;
  advice: string;
}

const baseTimes: Record<DrinkType, number> = {
  ristretto: 22,
  espresso: 28,
  lungo: 34,
};

export function calculateSmartDialIn(
  drinkType: DrinkType,
  roastLevel: number, // Assuming 1-5 scale
  time: number
): DialInResult {
  const targetTime = baseTimes[drinkType] + (3 - roastLevel) * 2;
  const deviation = Math.abs(time - targetTime);
  const deviationPercent = (deviation / targetTime) * 100;

  let feedback: DialInFeedback;
  let message: string;
  let advice = "";

  if (deviationPercent <= 8) {
    feedback = "perfect";
    message = "חילוץ מעולה! הטעמים מאוזנים.";
  } else if (deviationPercent <= 15) {
    feedback = "good";
    message = "כמעט שם. נסה תיקון קל בטחינה לדיוק מקסימלי.";
    if (time < targetTime) {
      advice = "טחן דק יותר ⬆️";
    } else {
      advice = "טחן גס יותר ⬇️";
    }
  } else {
    feedback = "bad";
    message = "החילוץ רחוק מהיעד. יש לשנות את רמת הטחינה באופן משמעותי.";
    if (time < targetTime) {
      advice = "טחן דק יותר ⬆️";
    } else {
      advice = "טחן גס יותר ⬇️";
    }
  }

  return {
    targetTime,
    actualTime: time,
    feedback,
    message,
    advice,
  };
}

import type { RoastLevel } from './dial-in';

export type DrinkType =
  | "לאטה"
  | "קפוצ'ינו"
  | "אמריקנו"
  | "אספרסו"
  | "מקיאטו"
  | "פלאט וויט"
  | "אייס לאטה"
  | "אייס אמריקנו"
  | "קולד ברו"
  | "אייס וניל"
  | "אחר";

export type MilkType =
  | "פרה"
  | "שיבולת שועל"
  | "סויה"
  | "שקדים"
  | "דל שומן"
  | "נטול לקטוז"
  | "חלב אורז"
  | "ללא";

export interface DrinkRecipe {
  id: string;
  drinkType: DrinkType;
  milkType: MilkType;
  milkAmountMl: number;
  sugarSyrup: string;
  /** Free text for ice amount, e.g. "6-8" for cubes */
  ice: string;
  notes: string;
}

export interface Person {
  id: string;
  name: string;
  recipes: DrinkRecipe[];
}

export interface DialInRecord {
  id: string;
  dose: number;
  yield: number;
  time: number;
  ratio: number;
  feedback: "perfect" | "too_fast" | "too_slow";
  createdAt: string;
}

export interface SavedBean {
  id: string;
  roasterName: string;
  beanName: string;
  grindSetting: string;
  roastLevel?: RoastLevel;
  roasteryLink?: string;
  beanDescription?: string;
  /** Flavor profile tags (multiple) */
  flavorTags?: string[];
  pricePaid?: number;
  bagWeightGrams?: number;
  createdAt: string;
  openedDate?: string;
}

/** Pre-defined flavor tags for beans */
export const FLAVOR_TAGS = [
  "שוקולדי",
  "אגוזי",
  "פירותי",
  "הדרים",
  "פרחוני",
  "קרמל",
  "מתובל",
  "פירות יער",
] as const;

export const DRINK_TYPES: DrinkType[] = [
  "אספרסו",
  "לאטה",
  "קפוצ'ינו",
  "אמריקנו",
  "מקיאטו",
  "פלאט וויט",
  "אייס לאטה",
  "אייס אמריקנו",
  "קולד ברו",
  "אייס וניל",
  "אחר",
];

export const MILK_TYPES: MilkType[] = [
  "פרה",
  "שיבולת שועל",
  "סויה",
  "שקדים",
  "דל שומן",
  "נטול לקטוז",
  "חלב אורז",
  "ללא",
];

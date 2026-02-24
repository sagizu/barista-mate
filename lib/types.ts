
export type RoastLevel = 1 | 2 | 3 | 4 | 5;

export interface Roastery {
  id: string;
  name: string;
  isFromStaticList: boolean;
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
  beanDescription?: string;
  /** Flavor profile tags (multiple) */
  flavorTags?: string[];
  pricePaid?: number;
  bagWeightGrams?: number;
  createdAt: string;
  openedDate?: string;
}

export interface MaintenanceDates {
  lastGroupHeadCleaning?: string;
  lastBackflush?: string;
  lastDescaling?: string;
  waterFilterLastChanged?: string;
}

export interface GeneralSettings {
  machineName?: string;
  defaultDose?: number;
  targetRatio?: number;
  activeBeanId?: string | null;
  activeBeanOpenedDate?: string;
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

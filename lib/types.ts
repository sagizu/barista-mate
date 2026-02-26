
import { DialInFeedback, DrinkType } from "./dial-in";

export type RoastLevel = 1 | 2 | 3 | 4 | 5;

export interface Roastery {
  id: string;
  name: string;
  isFromStaticList: boolean;
}

export interface DialInRecord {
  drinkType: DrinkType;
  roastLevel: number;
  time: number;
  targetTime: number;
  feedback: DialInFeedback;
  advice: string;
  grindSetting?: string;
  dose?: number;
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
  dose?: number;
}

export interface MaintenanceDates {
  lastGroupHeadCleaning?: string;
  lastBackflush?: string;
  lastDescaling?: string;
  waterFilterLastChanged?: string;
}

export interface GeneralSettings {
  machineName?: string;
  activeBeanId?: string | null;
  activeBeanOpenedDate?: string;
}

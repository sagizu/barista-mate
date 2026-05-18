
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
  isTestData?: boolean;
  grindSetting?: string | null;
  roastLevel?: RoastLevel | null;
  beanDescription?: string | null;
  /** Flavor profile tags (multiple) */
  flavorTags?: string[];
  pricePaid?: number | null;
  bagWeightGrams?: number | null;
  pricePerKilo?: number | null;
  createdAt: string;
  openedDate?: string;
  dose?: number;
  rating?: number | null;
  imageUrl?: string | null;
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

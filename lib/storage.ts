"use client";

import type { Person, DialInRecord, SavedBean } from "./types";

const PEOPLE_KEY = "barista-mate-people";
const DIAL_IN_HISTORY_KEY = "barista-mate-dial-in-history";
const SAVED_BEANS_KEY = "barista-mate-saved-beans";
const MACHINE_NAME_KEY = "barista-mate-machine-name";
export const ACTIVE_BEAN_ID_KEY = "barista-mate-active-bean-id";


export function getStoredPeople(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setStoredPeople(people: Person[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}

export function getStoredDialInHistory(): DialInRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DIAL_IN_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setStoredDialInHistory(records: DialInRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DIAL_IN_HISTORY_KEY, JSON.stringify(records));
}

export function addDialInRecord(record: Omit<DialInRecord, "id" | "createdAt">) {
  const history = getStoredDialInHistory();
  const newRecord: DialInRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [newRecord, ...history].slice(0, 50);
  setStoredDialInHistory(next);
  return newRecord;
}

export function getStoredBeans(): SavedBean[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_BEANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setStoredBeans(beans: SavedBean[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_BEANS_KEY, JSON.stringify(beans));
}

export function addSavedBean(bean: Omit<SavedBean, "id" | "createdAt">) {
  const beans = getStoredBeans();
  const newBean: SavedBean = {
    ...bean,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [newBean, ...beans];
  setStoredBeans(next);
  return newBean;
}

export function updateSavedBean(bean: SavedBean) {
  const beans = getStoredBeans();
  const next = beans.map((b) => (b.id === bean.id ? bean : b));
  setStoredBeans(next);
}

export function removeSavedBean(id: string) {
  const next = getStoredBeans().filter((b) => b.id !== id);
  setStoredBeans(next);
}

export function getMachineName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MACHINE_NAME_KEY) ?? "";
}

export function setMachineName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MACHINE_NAME_KEY, name.trim());
}

export function getActiveBeanId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_BEAN_ID_KEY);
}

export function setActiveBeanId(id: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_BEAN_ID_KEY, id);
}


// --- Maintenance Log ---
export interface MaintenanceDates {
    lastGroupHeadCleaning: string;
    lastBackflush: string;
    lastDescaling: string;
    waterFilterLastChanged: string;
}

const MAINTENANCE_KEY = "barista-mate-maintenance";

const defaultMaintenance = (): MaintenanceDates => ({
    lastGroupHeadCleaning: "",
    lastBackflush: "",
    lastDescaling: "",
    waterFilterLastChanged: "",
});

export function getMaintenanceDates(): MaintenanceDates {
  if (typeof window === "undefined") return defaultMaintenance();
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    if (!raw) return defaultMaintenance();
    const parsed = JSON.parse(raw) as Partial<MaintenanceDates>;
    return {
        ...defaultMaintenance(),
        ...parsed,
    };
  } catch {
    return defaultMaintenance();
  }
}

export function setMaintenanceDates(dates: MaintenanceDates) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(dates));
}

export function markMaintenanceDone(
  key: keyof MaintenanceDates,
  date: string
): MaintenanceDates {
  const next = {
    ...getMaintenanceDates(),
    [key]: date,
  };
  setMaintenanceDates(next);
  return next;
}

// --- General Settings ---
export interface GeneralSettings {
    defaultDose: number;
    targetRatio: number;
}

const GENERAL_SETTINGS_KEY = "barista-mate-general-settings";

const defaultGeneralSettings = (): GeneralSettings => ({
    defaultDose: 18,
    targetRatio: 2,
});

export function getGeneralSettings(): GeneralSettings {
    if (typeof window === "undefined") return defaultGeneralSettings();
    try {
        const raw = localStorage.getItem(GENERAL_SETTINGS_KEY);
        if (!raw) return defaultGeneralSettings();
        const parsed = JSON.parse(raw) as Partial<GeneralSettings>;
        return { ...defaultGeneralSettings(), ...parsed };
    } catch {
        return defaultGeneralSettings();
    }
}

export function setGeneralSettings(settings: Partial<GeneralSettings>) {
    if (typeof window === "undefined") return;
    const current = getGeneralSettings();
    localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

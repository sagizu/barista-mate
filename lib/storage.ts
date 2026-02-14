"use client";

import type { Person, DialInRecord, SavedBean } from "./types";

const PEOPLE_KEY = "barista-mate-people";
const DIAL_IN_HISTORY_KEY = "barista-mate-dial-in-history";
const SAVED_BEANS_KEY = "barista-mate-saved-beans";
const MACHINE_NAME_KEY = "barista-mate-machine-name";

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

// --- Maintenance Log ---
export interface MaintenanceDates {
  lastBackflush: string; // ISO
  lastWaterFilter: string;
  lastDescaling: string;
}

const MAINTENANCE_KEY = "barista-mate-maintenance";

const defaultMaintenance = (): MaintenanceDates => ({
  lastBackflush: "",
  lastWaterFilter: "",
  lastDescaling: "",
});

export function getMaintenanceDates(): MaintenanceDates {
  if (typeof window === "undefined") return defaultMaintenance();
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    if (!raw) return defaultMaintenance();
    const parsed = JSON.parse(raw) as Partial<MaintenanceDates>;
    return {
      lastBackflush: parsed.lastBackflush ?? "",
      lastWaterFilter: parsed.lastWaterFilter ?? "",
      lastDescaling: parsed.lastDescaling ?? "",
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
  key: keyof MaintenanceDates
): MaintenanceDates {
  const next = {
    ...getMaintenanceDates(),
    [key]: new Date().toISOString(),
  };
  setMaintenanceDates(next);
  return next;
}

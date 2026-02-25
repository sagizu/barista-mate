"use client";

import type { SavedBean } from "./types";

const SAVED_BEANS_KEY = "barista-mate-saved-beans";
const MACHINE_NAME_KEY = "barista-mate-machine-name";
export const ACTIVE_BEAN_ID_KEY = "barista-mate-active-bean-id";


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

export const ACTIVE_BEAN_OPENED_DATE_KEY = "barista-mate-active-bean-opened-date";

export function getActiveBeanOpenedDate(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ACTIVE_BEAN_OPENED_DATE_KEY) ?? "";
}

export function setActiveBeanOpenedDate(date: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_BEAN_OPENED_DATE_KEY, date);
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

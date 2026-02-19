
"use client";

const ROASTERIES_KEY = "coffee-roasteries";

export function getStoredRoasteries(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(ROASTERIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading roasteries from localStorage", error);
    return [];
  }
}

export function addStoredRoastery(roastery: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredRoasteries();
    if (!current.includes(roastery)) {
      const next = [...current, roastery].sort();
      window.localStorage.setItem(ROASTERIES_KEY, JSON.stringify(next));
    }
  } catch (error) {
    console.error("Error saving roastery to localStorage", error);
  }
}

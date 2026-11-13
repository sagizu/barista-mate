'use client';

import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { app } from '@/firebase-config';

let analyticsPromise: Promise<Analytics | null> | null = null;

function getSafeAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

export async function trackEvent(
  eventName:
    | 'landing_view'
    | 'signin_google'
    | 'signin_guest'
    | 'dial_in_completed'
    | 'share_clicked'
    | 'explore_view',
  params?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const analytics = await getSafeAnalytics();
    if (!analytics) return;
    logEvent(analytics, eventName, params);
  } catch {
    // Analytics should never interrupt UX
  }
}

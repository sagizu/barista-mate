'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_banner_dismissed';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.localStorage?.getItem === 'function' && window.localStorage.getItem(DISMISS_KEY) === 'true') return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    if (isIos) {
      setShowIosTip(true);
      setDismissed(false);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  if (dismissed || (!deferredPrompt && !showIosTip)) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#C67C4E]/40 bg-[#1F1712] px-4 py-3 text-sm text-[#EAE0D5] shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg bg-[#C67C4E]/15 p-2 text-[#C67C4E] shrink-0">
          {showIosTip ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#E6D2B5]">התקן את Barista Mate כאפליקציה</p>
          <p className="text-xs text-[#EAE0D5]/70">
            {showIosTip
              ? 'לחץ על כפתור השיתוף בדפדפן ובחר "הוסף למסך הבית" לגישה מהירה.'
              : 'לגישה מהירה מהמסך הראשי והתראות תחזוקה אמינות יותר.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt && (
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90 h-8 text-xs"
          >
            התקן
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="סגור"
          className="h-7 w-7 text-[#EAE0D5]/50 hover:text-[#EAE0D5]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

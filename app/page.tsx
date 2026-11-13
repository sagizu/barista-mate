'use client';

import { useAuth } from '@/lib/auth-context';
import Dashboard from '@/components/dashboard';
import { Loader2, Calculator, Book, Wrench, Coffee, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signInWithGoogle, signInAsGuest } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { db } from '@/firebase-config';
import { collection, getCountFromServer } from 'firebase/firestore';
import { SmartDialIn } from '@/components/smart-dial-in';
import React, { useEffect, useState } from 'react';

const LandingPage = () => {
  const [communityStats, setCommunityStats] = useState<{ roasters: number; beans: number } | null>(null);
  const [showDemoDialIn, setShowDemoDialIn] = useState(false);

  useEffect(() => {
    trackEvent('landing_view');
    let active = true;
    async function loadStats() {
      try {
        const [roastersSnap, beansSnap] = await Promise.all([
          getCountFromServer(collection(db, 'global_roasters')),
          getCountFromServer(collection(db, 'global_beans')),
        ]);
        if (!active) return;
        const roasters = roastersSnap.data().count;
        const beans = beansSnap.data().count;
        if (roasters > 0 && beans > 0) {
          setCommunityStats({ roasters, beans });
        }
      } catch {
        // Ignore if offline or unauthenticated in restricted environments
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08] rtl text-[#EAE0D5]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto pt-6 pb-8 md:pt-12 md:pb-10">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-2xl bg-[#C67C4E]/15 border border-[#C67C4E]/40 p-4 shadow-[0_0_24px_rgba(198,124,78,0.2)]">
              <Coffee className="w-12 h-12 text-[#C67C4E]" />
            </div>

            {communityStats && (
              <Badge
                variant="outline"
                className="border-[#C67C4E]/40 bg-[#1F1712] text-[#E6D2B5] px-3 py-1 text-xs font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 ml-1.5 text-[#C67C4E]" />
                כבר במאגר: {communityStats.roasters} בתי קלייה ו-{communityStats.beans} סוגי פולים
              </Badge>
            )}

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#E6D2B5]">
              Barista Mate
            </h1>
            <p className="max-w-[680px] text-lg md:text-xl font-medium text-[#EAE0D5]/90 leading-relaxed">
              הכלי האולטימטיבי לשיפור חווית האספרסו הביתית שלך.
            </p>
            <p className="max-w-[560px] text-sm text-[#EAE0D5]/65">
              כוון את הטחינה תוך שניות, שמור את הפולים האהובים עליך, וקבל תזכורות תחזוקה אוטומטיות ישירות לנייד.
            </p>
          </div>
        </section>

        {/* Action Center */}
        <section className="w-full max-w-sm mx-auto pb-12">
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                trackEvent('signin_google');
                signInWithGoogle();
              }}
              className="w-full bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90 font-semibold h-12 text-base shadow-[0_6px_20px_rgba(198,124,78,0.28)]"
              size="lg"
            >
              התחברות מהירה עם Google
            </Button>
            <Button
              onClick={() => {
                trackEvent('signin_guest');
                signInAsGuest();
              }}
              variant="outline"
              className="w-full border-[#3E2C22] bg-[#1F1712]/80 text-[#E6D2B5] hover:bg-[#3E2C22]/50 h-11"
            >
              המשך כאורח
            </Button>
            <p className="text-xs text-[#EAE0D5]/60 text-center px-2">
              רוצה רק להציץ? אפשר להתחיל כאורח ולשדרג לחשבון Google בכל רגע מתוך ההגדרות.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDemoDialIn((prev) => !prev)}
              className="text-xs text-[#C67C4E] hover:text-[#E6D2B5] hover:bg-[#1F1712]"
            >
              {showDemoDialIn ? 'הסתר הדגמת כיול חכם' : '☕ נסה את מחשבון הכיול עכשיו (ללא הרשמה)'}
            </Button>
          </div>
        </section>

        {showDemoDialIn && (
          <section className="w-full max-w-xl mx-auto pb-12 text-right">
            <SmartDialIn isDemo />
          </section>
        )}

        {/* Feature Grid */}
        <section className="w-full max-w-5xl mx-auto">
          <div className="grid items-stretch justify-center gap-4 md:grid-cols-3 text-right">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#3E2C22] bg-[#1F1712]/80 p-6 hover:border-[#C67C4E]/40 transition-colors">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center rounded-xl bg-[#C67C4E]/15 border border-[#C67C4E]/30 p-3">
                  <Calculator className="w-6 h-6 text-[#C67C4E]" />
                </div>
                <h3 className="text-xl font-bold text-[#E6D2B5]">מחשבון כיול</h3>
                <p className="text-sm text-[#EAE0D5]/75 leading-relaxed">
                  מחשבון מיצוי חכם להתאמת הטחינה והזמן לפי סוג המשקה ודרגת הקלייה.
                </p>
              </div>
              <span className="text-xs text-[#C67C4E] font-medium">⏱️ טיימר חילוץ מדויק · עדכון בלחיצה</span>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#3E2C22] bg-[#1F1712]/80 p-6 hover:border-[#C67C4E]/40 transition-colors">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center rounded-xl bg-[#C67C4E]/15 border border-[#C67C4E]/30 p-3">
                  <Book className="w-6 h-6 text-[#C67C4E]" />
                </div>
                <h3 className="text-xl font-bold text-[#E6D2B5]">ספריית פולים</h3>
                <p className="text-sm text-[#EAE0D5]/75 leading-relaxed">
                  ניהול ספריית פולים אישית עם סינון לפי טעמים, חלון טריות והמלצות קהילה.
                </p>
              </div>
              <span className="text-xs text-[#C67C4E] font-medium">✨ המלצות חכמות לפי הטעם שלך</span>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#3E2C22] bg-[#1F1712]/80 p-6 hover:border-[#C67C4E]/40 transition-colors">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center rounded-xl bg-[#C67C4E]/15 border border-[#C67C4E]/30 p-3">
                  <Wrench className="w-6 h-6 text-[#C67C4E]" />
                </div>
                <h3 className="text-xl font-bold text-[#E6D2B5]">עמוד תחזוקה</h3>
                <p className="text-sm text-[#EAE0D5]/75 leading-relaxed">
                  מעקב תחזוקה שוטפת למכונה (אבנית, פילטר, ניקוי ראש) עם התראות Push לנייד.
                </p>
              </div>
              <span className="text-xs text-[#C67C4E] font-medium inline-flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" /> תזכורות אוטומטיות לאנדרואיד ודפדפן
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-[#3E2C22]/60">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-center gap-6">
          <a href="/explore" className="text-sm text-[#C67C4E] hover:underline">
            מאגר בתי קלייה ופולים
          </a>
          <a href="/privacy" className="text-sm text-[#EAE0D5]/60 hover:text-[#C67C4E] hover:underline">
            מדיניות פרטיות
          </a>
        </div>
      </footer>
    </div>
  );
};

export default function Home() {
    const { user, loading } = useAuth();
    const loadingStyle = { '--background-cream': '#F5F5DC' } as React.CSSProperties;

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100" style={loadingStyle}>
                <Loader2 className="h-12 w-12 animate-spin text-[#C67C4E]" />
            </div>
        );
    }

    if (user) {
        return <Dashboard />;
    }

    return <LandingPage />;
}

'use client';

import { useAuth } from '@/lib/auth-context';
import Dashboard from '@/components/dashboard';
import { Loader2, Calculator, Book, Wrench, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signInAsGuest } from '@/lib/auth';
import React from 'react';

const LandingPage = () => {
  const style = {
    '--primary-color': '#C67C4E',
    '--dark-accent': '#3E2C22',
    '--background-cream': '#F5F5DC'
  } as React.CSSProperties;

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08] rtl" style={style}>
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto pt-16 pb-2 md:pt-24 md:pb-4">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-2 text-center">
              <Coffee className="w-16 h-16 text-[var(--primary-color)]" />
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter" style={{color: 'var(--dark-accent)'}}>
                Barista Mate
              </h1>
              <p className="max-w-[700px] text-lg md:text-xl font-medium text-zinc-100">
                הכלי האולטימטיבי לשיפור חווית האספרסו הביתית שלך.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full max-w-5xl mx-auto">
          <div className="container grid items-start justify-center gap-2 px-4 md:px-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center rounded-full bg-[var(--primary-color)] p-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{color: 'var(--dark-accent)'}}>מחשבון כיול</h3>
              <p className="text-zinc-300">מחשבון מיצוי חכם להתאמת הטחינה והזמן.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center rounded-full bg-[var(--primary-color)] p-4">
                <Book className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{color: 'var(--dark-accent)'}}>ספריית פולים</h3>
              <p className="text-zinc-300">ניהול ספריית פולים אישית עם סינון לפי טעמים ומחיר.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center rounded-full bg-[var(--primary-color)] p-4">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{color: 'var(--dark-accent)'}}>עמוד תחזוקה</h3>
              <p className="text-zinc-300">מעקב תחזוקה שוטפת למכונה (אבנית, פילטר, ניקוי ראש).</p>
            </div>
          </div>
        </section>

        {/* Action Center */}
        <section className="w-full max-w-xs mx-auto py-8">
          <div className="flex flex-col gap-4">
            <Button
              onClick={signInWithGoogle}
              className="w-full bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/90"
              size="lg"
            >
              התחברות עם Google
            </Button>
            <Button
              onClick={signInAsGuest}
              variant="link"
              className="text-slate-200"
            >
              המשך כאורח
            </Button>
            <p className="text-xs text-zinc-400 text-center px-4">
             במצב אורח, הנתונים נשמרים רק על המכשיר הנוכחי ויימחקו ביציאה.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-center">
          <a href="/privacy" className="text-sm text-zinc-400 hover:underline">
            Privacy Policy
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

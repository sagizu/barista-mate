'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingChecklistProps {
  hasBean: boolean;
  hasPush: boolean;
  hasDialIn?: boolean;
  onNavigateTab: (tab: 'beans' | 'dial-in' | 'maintenance') => void;
}

const DISMISS_KEY = 'onboarding_checklist_dismissed';

export function OnboardingChecklist({
  hasBean,
  hasPush,
  hasDialIn = false,
  onNavigateTab,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  const steps = [
    { id: 'bean', label: 'הוסף פול ראשון לספרייה', done: hasBean, tab: 'beans' as const },
    { id: 'dial', label: 'בצע כיול אספרסו ראשון', done: hasDialIn, tab: 'dial-in' as const },
    { id: 'push', label: 'הפעל התראות תחזוקה לנייד', done: hasPush, tab: 'maintenance' as const },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-[#3E2C22] bg-[#1F1712]/90 p-4 shadow-md">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#E6D2B5]">
          <Sparkles className="h-4 w-4 text-[#C67C4E]" />
          <span>מתחילים עם Barista Mate ({completedCount}/3)</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="הסתר רשימת התחלה"
          className="h-7 w-7 text-[#EAE0D5]/50 hover:text-[#EAE0D5]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onNavigateTab(step.tab)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-right text-xs transition-colors ${
              step.done
                ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300'
                : 'border-[#3E2C22] bg-[#0f0a08]/50 text-[#EAE0D5] hover:border-[#C67C4E]/50'
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-[#C67C4E] shrink-0" />
            )}
            <span className={step.done ? 'line-through opacity-75' : ''}>{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

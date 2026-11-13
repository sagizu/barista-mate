'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { signInWithGoogle } from '@/lib/auth';
import { addBean } from '@/lib/firestore';
import type { RoastLevel } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoastRatingInput } from '@/components/roast-rating-input';
import { Coffee, PlusCircle, Check, ArrowRight } from 'lucide-react';

function SharedBeanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const roasterName = searchParams.get('roaster')?.trim() || '';
  const beanName = searchParams.get('bean')?.trim() || '';
  const roastParam = Number(searchParams.get('roast'));
  const roastLevel = roastParam >= 1 && roastParam <= 5 ? (roastParam as RoastLevel) : null;
  const grindSetting = searchParams.get('grind')?.trim() || null;
  const flavorTags = (searchParams.get('flavors') || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportBean = async () => {
    if (!roasterName || !beanName) return;
    setError(null);
    setIsAdding(true);

    try {
      if (!user) {
        await signInWithGoogle();
      }
      await addBean({
        roasterName,
        beanName,
        roastLevel,
        grindSetting,
        flavorTags,
      });
      setAdded(true);
    } catch (err) {
      console.error('Error importing shared bean:', err);
      setError('לא ניתן להוסיף את הפול כרגע. נסה שוב.');
    } finally {
      setIsAdding(false);
    }
  };

  if (!roasterName || !beanName) {
    return (
      <Card className="max-w-md w-full bg-[#1F1712] border-[#3E2C22] text-center">
        <CardContent className="p-8 space-y-4">
          <Coffee className="h-12 w-12 text-[#C67C4E] mx-auto" />
          <h1 className="text-xl font-bold text-[#E6D2B5]">מתכון קפה לא נמצא</h1>
          <p className="text-sm text-[#EAE0D5]/70">נראה שהקישור שקיבלת חסר פרטים.</p>
          <Button onClick={() => router.push('/')} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
            מעבר ל-Barista Mate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg w-full bg-[#1F1712] border-[#C67C4E]/60 shadow-[0_0_24px_rgba(198,124,78,0.18)]">
      <CardHeader className="text-right space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-[#C67C4E]/40 bg-[#C67C4E]/10 text-[#E6D2B5]">
            המלצת קפה משותפת
          </Badge>
          <Coffee className="h-5 w-5 text-[#C67C4E]" />
        </div>
        <p className="text-sm text-[#C67C4E] font-medium pt-2">{roasterName}</p>
        <CardTitle className="text-2xl text-[#E6D2B5]">{beanName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-right">
        <div className="flex flex-wrap items-center gap-4">
          {grindSetting && (
            <Badge className="bg-[#C67C4E]/20 text-[#E6D2B5] border-[#C67C4E]/40">
              דרגת טחינה: {grindSetting}
            </Badge>
          )}
          {roastLevel && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#EAE0D5]/80">קלייה:</span>
              <RoastRatingInput rating={roastLevel} onRatingChange={() => {}} disabled />
            </div>
          )}
        </div>

        {flavorTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {flavorTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2.5 py-1 text-xs text-[#E6D2B5]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {added ? (
            <Button onClick={() => router.push('/')} className="flex-1 bg-emerald-700 text-white hover:bg-emerald-600">
              <Check className="h-4 w-4 ml-2" />
              נוסף לספרייה! פתח אפליקציה
            </Button>
          ) : (
            <Button
              onClick={handleImportBean}
              disabled={isAdding}
              className="flex-1 bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90"
            >
              <PlusCircle className="h-4 w-4 ml-2" />
              {isAdding ? 'מוסיף...' : user ? 'הוסף לספרייה שלי' : 'התחבר עם Google והוסף לספרייה'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-[#3E2C22] text-[#EAE0D5]"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            לדף הבית
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShareBeanPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08]">
      <Suspense fallback={<div className="text-[#E6D2B5]">טוען מתכון...</div>}>
        <SharedBeanContent />
      </Suspense>
    </div>
  );
}

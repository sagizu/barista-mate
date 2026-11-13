'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoastRatingInput } from '@/components/roast-rating-input';
import { buildBeanShareUrl } from '@/lib/share-card';
import { trackEvent } from '@/lib/analytics';
import { Coffee, Search, PlusCircle, ArrowRight } from 'lucide-react';
import type { RoastLevel } from '@/lib/types';

export interface PublicGlobalBean {
  id: string;
  roasterName: string;
  beanName: string;
  roastLevel?: number;
  flavorTags?: string[];
}

interface ExploreClientProps {
  roasters: string[];
  beans: PublicGlobalBean[];
}

export function ExploreClient({ roasters, beans }: ExploreClientProps) {
  const [search, setSearch] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('explore_view');
  }, []);

  const filteredBeans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beans.filter((b) => {
      if (selectedRoaster && b.roasterName !== selectedRoaster) return false;
      if (!q) return true;
      return (
        b.beanName.toLowerCase().includes(q) ||
        b.roasterName.toLowerCase().includes(q) ||
        (b.flavorTags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [beans, search, selectedRoaster]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08] text-[#EAE0D5]">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#E6D2B5] flex items-center gap-2">
              <Coffee className="h-7 w-7 text-[#C67C4E]" />
              מאגר בתי קלייה ופולים
            </h1>
            <p className="text-sm text-[#EAE0D5]/70">
              גלה פולי קפה מומלצים מבתי הקלייה בישראל והוסף אותם לספרייה האישית שלך בלחיצה.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-[#3E2C22] text-[#E6D2B5]">
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה ל-Barista Mate
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#EAE0D5]/50 absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש לפי שם פול, בית קלייה או פרופיל טעם..."
              className="pr-9 bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]"
            />
          </div>
          {selectedRoaster && (
            <Button variant="ghost" onClick={() => setSelectedRoaster(null)} className="text-[#C67C4E]">
              נקה סינון ({selectedRoaster})
            </Button>
          )}
        </div>

        {roasters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {roasters.map((r) => (
              <Badge
                key={r}
                variant={selectedRoaster === r ? 'default' : 'outline'}
                onClick={() => setSelectedRoaster(selectedRoaster === r ? null : r)}
                className={`cursor-pointer px-3 py-1 text-xs ${
                  selectedRoaster === r
                    ? 'bg-[#C67C4E] text-white'
                    : 'border-[#3E2C22] bg-[#1F1712] text-[#E6D2B5] hover:border-[#C67C4E]/50'
                }`}
              >
                {r}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBeans.map((bean) => {
            const sharePath = buildBeanShareUrl({
              roasterName: bean.roasterName,
              beanName: bean.beanName,
              roastLevel: bean.roastLevel as RoastLevel | undefined,
              flavorTags: bean.flavorTags,
            }).replace('https://barista-mate.vercel.app', '');

            return (
              <Card key={bean.id} className="bg-[#1F1712] border-[#3E2C22] hover:border-[#C67C4E]/40 transition-colors flex flex-col">
                <CardHeader className="pb-2">
                  <p className="text-xs text-[#C67C4E] font-medium">{bean.roasterName}</p>
                  <CardTitle className="text-lg text-[#E6D2B5]">{bean.beanName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {bean.roastLevel && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#EAE0D5]/70">קלייה:</span>
                        <RoastRatingInput rating={bean.roastLevel} onRatingChange={() => {}} disabled size="sm" />
                      </div>
                    )}
                    {bean.flavorTags && bean.flavorTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {bean.flavorTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2.5 py-0.5 text-[11px] text-[#E6D2B5]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <Link href={sharePath}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#C67C4E]/40 text-[#E6D2B5] hover:bg-[#C67C4E]/15"
                      >
                        <PlusCircle className="h-3.5 w-3.5 ml-1.5 text-[#C67C4E]" />
                        הוסף לספרייה שלי
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

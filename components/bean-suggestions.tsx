"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase-config";
import type { SavedBean } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { RoastRatingInput } from "./roast-rating-input";

interface BeanSuggestionsProps {
  userBeans: SavedBean[];
}

export function BeanSuggestions({ userBeans }: BeanSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!userBeans || userBeans.length === 0) {
        setLoading(false);
        return;
      }

      // 1. Analyze user beans
      const flavorCounts: Record<string, number> = {};
      let totalRoast = 0;
      let roastCount = 0;
      
      const userBeanKeys = new Set<string>();

      userBeans.forEach(bean => {
        if (bean.roasterName && bean.beanName) {
            userBeanKeys.add(`${bean.roasterName}-${bean.beanName}`.toLowerCase());
        }
        
        if (bean.flavorTags) {
          bean.flavorTags.forEach(tag => {
            flavorCounts[tag] = (flavorCounts[tag] || 0) + 1;
          });
        }
        if (bean.roastLevel) {
          totalRoast += bean.roastLevel;
          roastCount++;
        }
      });

      const avgRoast = roastCount > 0 ? Math.round(totalRoast / roastCount) : 3;
      
      // Get top flavors (max 10 for array-contains-any limit in Firestore)
      const sortedFlavors = Object.entries(flavorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 10);

      if (sortedFlavors.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const globalBeansRef = collection(db, "global_beans");
        const q = query(
          globalBeansRef,
          where("flavorTags", "array-contains-any", sortedFlavors),
          limit(50) // fetch a solid chunk to score client-side
        );

        const snapshot = await getDocs(q);
        const candidates: any[] = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          const uniqueKey = `${data.roasterName}-${data.beanName}`.toLowerCase();
          
          // Skip if user already has it in their personal library
          if (userBeanKeys.has(uniqueKey)) return;

          let score = 0;
          
          // +2 points for each exact matching flavor from user's top flavors
          if (data.flavorTags) {
              data.flavorTags.forEach((tag: string) => {
                if (sortedFlavors.includes(tag)) {
                  score += 2;
                }
              });
          }

          // +1 point for exact roast match, +0.5 for a close match
          if (data.roastLevel) {
              if (data.roastLevel === avgRoast) score += 1;
              else if (Math.abs(data.roastLevel - avgRoast) === 1) score += 0.5;
          }

          candidates.push({ id: doc.id, ...data, score });
        });

        // Sort by score descending and take the absolute top 3 matches
        candidates.sort((a, b) => b.score - a.score);
        
        // Remove duplicate candidate suggestions (same roaster + bean name) globally
        const uniqueCandidates: any[] = [];
        const seenNames = new Set<string>();
        for (const c of candidates) {
            const key = `${c.roasterName}-${c.beanName}`.toLowerCase();
            if (!seenNames.has(key)) {
                seenNames.add(key);
                uniqueCandidates.push(c);
            }
        }

        setSuggestions(uniqueCandidates.slice(0, 3));
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
            console.error("Error fetching bean suggestions:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [userBeans]);

  if (loading) {
    return (
      <div className="mt-8 space-y-4 pt-8">
        <h3 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#C67C4E]" />
          המלצות עבורך
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl bg-[#1F1712] border border-[#3E2C22]" />)}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-8 space-y-4 pt-8">
      <h3 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#C67C4E]" />
        המלצות עבורך
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {suggestions.map((bean) => (
          <Card key={bean.id} className="bg-[#1F1712] border-[#3E2C22] transition-colors hover:border-[#C67C4E]/30 relative overflow-hidden">
             {/* Decorative side accent reflecting "smart recommendation" style */}
             <div className="absolute top-0 right-0 w-1 h-full bg-[#C67C4E]/80"></div>
            <CardContent className="p-4 flex flex-col gap-3 text-right">
              <div>
                <p className="text-xs text-[#C67C4E] font-medium mb-1">{bean.roasterName}</p>
                <h4 className="font-semibold text-[#E6D2B5]">{bean.beanName}</h4>
              </div>

              {bean.roastLevel && (
                <div className="flex items-center gap-1.5 justify-start">
                  <span className="text-xs font-medium text-[#EAE0D5]/80">קלייה:</span>
                  <RoastRatingInput rating={bean.roastLevel} onRatingChange={() => {}} disabled size="sm" />
                </div>
              )}

              {bean.flavorTags && bean.flavorTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {bean.flavorTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2.5 py-1 text-[11px] text-[#E6D2B5]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

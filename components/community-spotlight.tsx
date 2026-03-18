"use client";

import { useEffect, useState } from "react";
import { collectionGroup, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db, auth } from "@/firebase-config";
import type { SavedBean } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { RoastRatingInput } from "./roast-rating-input";

export function CommunitySpotlight() {
  const [allValidBeans, setAllValidBeans] = useState<(SavedBean & { userId: string })[]>([]);
  const [spotlightBeans, setSpotlightBeans] = useState<(SavedBean & { userId: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const shuffleAndSet = (beans: (SavedBean & { userId: string })[]) => {
    if (beans.length === 0) return;
    const beansToShuffle = [...beans];
    for (let i = beansToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [beansToShuffle[i], beansToShuffle[j]] = [beansToShuffle[j], beansToShuffle[i]];
    }
    setSpotlightBeans(beansToShuffle.slice(0, 3));
  };

  useEffect(() => {
    async function fetchSpotlight() {
      try {
        const beansQuery = query(
          collectionGroup(db, 'beans'),
          orderBy('createdAt', 'desc'),
          limit(150)
        );

        const snapshot = await getDocs(beansQuery);
        const currentUserId = auth.currentUser?.uid;

        const validBeans: (SavedBean & { userId: string })[] = [];
        const seenBeans = new Set<string>();

        for (const doc of snapshot.docs) {
          if (validBeans.length >= 20) break;

          const data = doc.data() as SavedBean;
          const userId = doc.ref.parent.parent?.id || "";

          if (userId === currentUserId) continue;
          if (data.isTestData === true) continue;
          if (!data.flavorTags || data.flavorTags.length === 0) continue;
          if (!data.roastLevel) continue;

          const uniqueKey = `${data.roasterName}-${data.beanName}`.toLowerCase();
          if (seenBeans.has(uniqueKey)) continue;

          seenBeans.add(uniqueKey);
          validBeans.push({ ...data, id: doc.id, userId });
        }
        
        setAllValidBeans(validBeans);
        shuffleAndSet(validBeans);
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          console.error("Error fetching community spotlight:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSpotlight();
  }, []);

  useEffect(() => {
    const handleFocus = () => shuffleAndSet(allValidBeans);
    window.addEventListener("focus", handleFocus);
    // Also re-shuffle if visibility changes to 'visible' (simulates tab-switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        shuffleAndSet(allValidBeans);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [allValidBeans]);

  if (loading) {
    return (
      <div className="mt-12 space-y-4 border-t border-[#3E2C22] pt-8">
        <h3 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
          <Users className="h-5 w-5 text-[#C67C4E]" />
          מה הקהילה שותה?
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl bg-[#1F1712] border border-[#3E2C22]" />)}
        </div>
      </div>
    );
  }

  if (spotlightBeans.length === 0) return null;

  return (
    <div className="mt-12 space-y-4 border-t border-[#3E2C22] pt-8">
      <h3 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
        <Users className="h-5 w-5 text-[#C67C4E]" />
        מה הקהילה שותה?
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {spotlightBeans.map((bean) => (
          <Card key={bean.id} className="bg-[#1F1712] border-[#3E2C22] transition-colors hover:border-[#C67C4E]/30">
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
                  {bean.flavorTags.map((tag) => (
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

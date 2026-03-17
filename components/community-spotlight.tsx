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

  useEffect(() => {
    async function fetchSpotlight() {
      try {
        const beansQuery = query(
          collectionGroup(db, 'beans'),
          orderBy('createdAt', 'desc'),
          limit(50)
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
          if (!data.pricePerKilo || data.pricePerKilo <= 0) continue;

          const uniqueKey = `${data.roasterName}-${data.beanName}`.toLowerCase();
          if (seenBeans.has(uniqueKey)) continue;

          seenBeans.add(uniqueKey);
          validBeans.push({ ...data, id: doc.id, userId });
        }
        
        setAllValidBeans(validBeans);
      } catch (error) {
        console.error("Error fetching community spotlight:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSpotlight();
  }, []);

  useEffect(() => {
    if (allValidBeans.length === 0) return;

    // Create a copy to shuffle
    const beansToShuffle = [...allValidBeans];

    // Fisher-Yates Shuffle
    for (let i = beansToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [beansToShuffle[i], beansToShuffle[j]] = [beansToShuffle[j], beansToShuffle[i]];
    }

    setSpotlightBeans(beansToShuffle.slice(0, 3));
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
            <CardContent className="p-4 flex flex-col h-full justify-between gap-3">
              <div>
                <p className="text-xs text-[#C67C4E] font-medium mb-1">{bean.roasterName}</p>
                <h4 className="font-semibold text-[#E6D2B5] line-clamp-1">{bean.beanName}</h4>
              </div>

              {bean.flavorTags && bean.flavorTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {bean.flavorTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2 py-0.5 text-[10px] text-[#E6D2B5]"
                    >
                      {tag}
                    </span>
                  ))}
                  {bean.flavorTags.length > 3 && (
                    <span className="text-[10px] text-[#EAE0D5]/60 flex items-center">
                      +{bean.flavorTags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end mt-1 pt-3 border-t border-[#3E2C22]/50">
                <div className="text-xs font-bold text-[#E6D2B5]">
                  {bean.pricePerKilo?.toFixed(0)}₪<span className="text-[#EAE0D5]/60 font-normal ml-0.5"> לקילו</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

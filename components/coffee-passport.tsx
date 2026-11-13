"use client";

import { useMemo } from "react";
import type { SavedBean } from "@/lib/types";
import { Coffee, Store, Award, Share2, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generatePassportShareImage, shareImageOrDownload } from "@/lib/share-card";

interface CoffeePassportProps {
  userBeans?: SavedBean[];
  userName?: string | null;
}

export function CoffeePassport({ userBeans = [], userName }: CoffeePassportProps) {
  const totalBeans = userBeans.length;
  const uniqueRoasters = new Set(userBeans.map(b => b.roasterName).filter(Boolean)).size;

  const tasteProfile = useMemo(() => {
    if (userBeans.length === 0) return null;
    const flavorCounts: Record<string, number> = {};
    let roastSum = 0;
    let roastCount = 0;

    userBeans.forEach((b) => {
      if (b.roastLevel) {
        roastSum += b.roastLevel;
        roastCount++;
      }
      b.flavorTags?.forEach((t) => {
        flavorCounts[t] = (flavorCounts[t] || 0) + 1;
      });
    });

    const avgRoast = roastCount > 0 ? Math.round(roastSum / roastCount) : null;
    const roastLabel =
      avgRoast === null
        ? null
        : avgRoast <= 2
        ? 'קלייה בהירה'
        : avgRoast === 3
        ? 'קלייה בינונית'
        : 'קלייה כהה';

    const topFlavors = Object.entries(flavorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag);

    const parts = [roastLabel, topFlavors.length > 0 ? topFlavors.join(' ו') : null].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [userBeans]);

  const unlockedBadges = useMemo(() => {
    const badges: string[] = [];
    if (totalBeans >= 1) badges.push('טועם מתחיל');
    if (uniqueRoasters >= 3) badges.push('חוקר בתי קלייה');
    if (totalBeans >= 5) badges.push('אספן קפה');
    return badges;
  }, [totalBeans, uniqueRoasters]);

  const handleShare = async () => {
    const profileLine = tasteProfile ? `\nסגנון הקפה שלי: ${tasteProfile}` : '';
    const text = `מדד הקפאין שלי ב-Barista Mate ☕\n\n${totalBeans} סוגי פולים באוסף\n${uniqueRoasters} בתי קלייה${profileLine}\n\nבואו לבדוק מה סגנון הקפה שלכם:\nhttps://barista-mate.vercel.app/`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'מדד הקפאין שלי',
          text: text,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        alert("הטקסט הועתק ללוח!");
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    } else {
       // Fallback for when testing over insecure HTTP (e.g. 192.168.x.x)
       alert("השיתוף וההעתקה זמינים רק בחיבור מאובטח (HTTPS) או דרך הדפדפן שלך.");
    }
  };

  const handleShareImage = async () => {
    try {
      const file = await generatePassportShareImage({ userName, totalBeans, uniqueRoasters });
      const text = `מדד הקפאין שלי ב-Barista Mate ☕ (${totalBeans} פולים, ${uniqueRoasters} בתי קלייה)`;
      await shareImageOrDownload(file, text, 'מדד הקפאין שלי', 'https://barista-mate.vercel.app/');
    } catch (error) {
      console.error("Error sharing passport image:", error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#3E2C22] bg-gradient-to-br from-[#2a1d18] to-[#1a110e] shadow-lg mb-4 pt-6 pb-4 px-5">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#C67C4E] rounded-full mix-blend-multiply filter blur-[60px] opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E07A5F] rounded-full mix-blend-multiply filter blur-[40px] opacity-10 transform -translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Header Profile */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#E6D2B5] tracking-tight">מדד קפאין</h3>
          <p className="text-xs text-[#C67C4E] pr-0.5">{userName || "אורח"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareImage}
            className="text-[#EAE0D5]/60 hover:text-[#C67C4E] hover:bg-[#3E2C22]/50 rounded-full h-8 w-8"
            title="שתף כתמונה"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="text-[#EAE0D5]/60 hover:text-[#C67C4E] hover:bg-[#3E2C22]/50 rounded-full h-8 w-8"
            title="שתף מדד"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid - Compact */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mb-3">
        
        {/* Total Beans Card */}
        <div className="bg-[#1F1712]/60 backdrop-blur-sm border border-[#3E2C22]/50 rounded-lg py-2.5 px-3 flex items-center justify-between">
          <div className="flex flex-col text-right">
             <span className="text-xs font-medium text-[#EAE0D5]/70">פולים באוסף</span>
             <span className="text-lg font-black text-[#E6D2B5]">{totalBeans}</span>
          </div>
          <Coffee className="h-5 w-5 text-[#C67C4E] opacity-80" />
        </div>

        {/* Unique Roasters Card */}
        <div className="bg-[#1F1712]/60 backdrop-blur-sm border border-[#3E2C22]/50 rounded-lg py-2.5 px-3 flex items-center justify-between">
           <div className="flex flex-col text-right">
             <span className="text-xs font-medium text-[#EAE0D5]/70">בתי קלייה</span>
             <span className="text-lg font-black text-[#E6D2B5]">{uniqueRoasters}</span>
          </div>
          <Store className="h-5 w-5 text-[#E07A5F] opacity-80" />
        </div>
      </div>

      {tasteProfile && (
        <div className="relative z-10 flex items-center gap-2 rounded-lg border border-[#C67C4E]/30 bg-[#1F1712]/70 px-3 py-2 text-xs text-[#E6D2B5] mb-2">
          <Sparkles className="h-3.5 w-3.5 text-[#C67C4E] shrink-0" />
          <span>סגנון הקפה שלך: <strong>{tasteProfile}</strong></span>
        </div>
      )}

      {unlockedBadges.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1.5 pt-1">
          {unlockedBadges.map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className="border-[#C67C4E]/40 bg-[#C67C4E]/10 text-[#E6D2B5] text-[11px]"
            >
              <Award className="h-3 w-3 ml-1 text-[#C67C4E]" />
              {badge}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

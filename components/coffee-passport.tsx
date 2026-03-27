"use client";

import type { SavedBean } from "@/lib/types";
import { Coffee, Store, Award, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoffeePassportProps {
  userBeans?: SavedBean[];
  userName?: string | null;
}

export function CoffeePassport({ userBeans = [], userName }: CoffeePassportProps) {
  const totalBeans = userBeans.length;
  const uniqueRoasters = new Set(userBeans.map(b => b.roasterName).filter(Boolean)).size;

  const handleShare = async () => {
    const text = `מדד הקפאין שלי ב-Barista Mate ☕\n\nטוויתי ${totalBeans} סוגי פולים שונים\nגיליתי ${uniqueRoasters} בתי קלייה\n\nבואו לנהל את אוסף הקפה שלכם!`;
    
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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export function FeatureAnnouncement() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the announcement
    const hasSeen = localStorage.getItem("hasSeenImageFeatureAnnouncement");
    if (!hasSeen) {
      // Add a slight delay so it doesn't jump immediately on initial load
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("hasSeenImageFeatureAnnouncement", "true");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
    }}>
      <DialogContent className="bg-[#1F1712] border-[#3E2C22] text-[#E6D2B5] max-w-sm rounded-xl" aria-describedby="feature-announcement-desc">
        <DialogHeader className="flex flex-col items-center gap-2 pt-4">
          <div className="w-12 h-12 rounded-full bg-[#C67C4E]/20 flex items-center justify-center mb-2">
            <Coffee className="w-6 h-6 text-[#C67C4E]" />
          </div>
          <DialogTitle className="text-xl text-center">חדש: תמונות בספריית הפולים!</DialogTitle>
        </DialogHeader>
        <div id="feature-announcement-desc" className="text-center text-[#EAE0D5]/80 space-y-4 py-4">
          <p>תודה רבה על הפידבק שלכם!</p>
          <p>
            הקשבנו לבקשות והוספנו אפשרות להעלות תמונות לכל פול בספרייה.
          </p>
          <p>
            המשך שימוש מהנה ונשמח לשמוע רעיונות נוספים!
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleClose} 
            className="w-full bg-[#C67C4E] hover:bg-[#A0603A] text-white"
          >
            הבנתי, תודה!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

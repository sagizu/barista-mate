
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoredRoasteries, addStoredRoastery } from "@/lib/roasteries-storage";
import { addBean, updateBean } from "@/lib/firestore";
import type { SavedBean, RoastLevel } from "@/lib/types";
import { RoastRatingInput } from "./roast-rating-input";

interface AddBeanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeanAdded: () => void;
  beanToEdit: SavedBean | Partial<SavedBean> | null;
  onDialogClose: () => void;
}

const flavorTagsOptions = ["שוקולדי", "אגוזי", "פירותי", "פרחוני", "מתוק", "חמצמץ"];

export function AddBeanDialog({
  open,
  onOpenChange,
  onBeanAdded,
  beanToEdit,
  onDialogClose,
}: AddBeanDialogProps) {
  const [bean, setBean] = useState<Partial<SavedBean>>({});
  const [roasteries, setRoasteries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRoasteries(getStoredRoasteries());
      if (beanToEdit && beanToEdit.id) { // Check for a full bean to edit
        setBean(beanToEdit);
      } else if (beanToEdit && beanToEdit.grindSetting) { // Partial bean with grind setting from dial-in
        setBean({ ...beanToEdit, flavorTags: [], roastLevel: undefined });
      } else { // For new beans, or partial beans without ID
        setBean({ flavorTags: [], roastLevel: undefined });
      }
    }
  }, [open, beanToEdit]);

  const handleSave = async () => {
    setError(null);
    if (!bean.beanName?.trim()) {
      setError('"שם הפול" הוא שדה חובה.');
      return;
    }
    if (!bean.roasterName?.trim()) {
      setError('"שם בית הקלייה" הוא שדה חובה.');
      return;
    }

    addStoredRoastery(bean.roasterName);

    try {
      if (bean.id) {
        await updateBean(bean.id, bean);
      } else {
        // Build bean object without undefined fields
        const beanToSave: any = {
          roasterName: bean.roasterName,
          beanName: bean.beanName,
          grindSetting: bean.grindSetting || '',
          flavorTags: bean.flavorTags || [],
        };
        
        // Only add optional fields if they have values
        if (bean.roastLevel !== undefined) {
          beanToSave.roastLevel = bean.roastLevel;
        }
        if (bean.roasteryLink) {
          beanToSave.roasteryLink = bean.roasteryLink;
        }
        if (bean.beanDescription) {
          beanToSave.beanDescription = bean.beanDescription;
        }
        if (bean.pricePaid !== undefined) {
          beanToSave.pricePaid = bean.pricePaid;
        }
        if (bean.bagWeightGrams !== undefined) {
          beanToSave.bagWeightGrams = bean.bagWeightGrams;
        }
        
        await addBean(beanToSave);
      }
      setBean({}); // Reset form
      onBeanAdded();
    } catch (err) {
      console.error('Error saving bean:', err);
      setError("שגיאה בשמירת הפול. נסה שוב.");
    }
  };

  const handleClose = () => {
    onDialogClose();
    setBean({ flavorTags: [], roastLevel: undefined }); // Reset form state on close
    setError(null);
  };

  const toggleFlavorTag = (tag: string) => {
    const currentTags = bean.flavorTags || [];
    if (currentTags.includes(tag)) {
      setBean({ ...bean, flavorTags: currentTags.filter((t) => t !== tag) });
    } else {
      setBean({ ...bean, flavorTags: [...currentTags, tag] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1F1712] border-[#3E2C22] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{bean.id ? "ערוך פול קיים" : "הוסף פול חדש"}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 pl-2 -mr-6 -ml-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roasterName" className="text-right">שם בית הקלייה</Label>
              <Input
                id="roasterName"
                value={bean.roasterName || ""}
                onChange={(e) => setBean({ ...bean, roasterName: e.target.value })}
                placeholder="הזן או בחר בית קלייה"
                list="roastery-suggestions"
              />
              <datalist id="roastery-suggestions">
                {roasteries.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="beanName" className="text-right">שם הפול</Label>
              <Input id="beanName" value={bean.beanName || ''} onChange={(e) => setBean({ ...bean, beanName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="pt-2">
                <Label>דרגת קלייה</Label>
                <div className="pt-2">
                 <RoastRatingInput 
                    rating={bean.roastLevel || 0}
                    onRatingChange={(newRating) => setBean({...bean, roastLevel: newRating === 0 ? undefined : newRating as RoastLevel})} 
                 />
                </div>
             </div>
             <div>
              <Label htmlFor="grindSetting" className="text-right">דרגת טחינה</Label>
              <Input id="grindSetting" value={bean.grindSetting || ''} onChange={(e) => setBean({ ...bean, grindSetting: e.target.value })} />
             </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="pricePaid">מחיר ששולם (₪)</Label>
                <Input id="pricePaid" type="number" value={bean.pricePaid || ''} onChange={(e) => setBean({ ...bean, pricePaid: e.target.value ? parseFloat(e.target.value) : undefined })} />
            </div>
            <div>
                <Label htmlFor="bagWeight">משקל שקית (גרם)</Label>
                <Input id="bagWeight" type="number" value={bean.bagWeightGrams || ''} onChange={(e) => setBean({ ...bean, bagWeightGrams: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
            </div>
           </div>
          <div>
            <Label>פרופיל טעמים</Label>
            <div className="flex flex-wrap gap-2 pt-2">
              {flavorTagsOptions.map((tag) => (
                <Button
                  key={tag}
                  variant={bean.flavorTags?.includes(tag) ? "default" : "outline"}
                  onClick={() => toggleFlavorTag(tag)}
                  className="rounded-full"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="roasteryLink" className="text-right">קישור לבית הקלייה</Label>
            <Input id="roasteryLink" type="url" value={bean.roasteryLink || ''} onChange={(e) => setBean({ ...bean, roasteryLink: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="beanDescription" className="text-right">תיאור הפולים</Label>
            <Textarea id="beanDescription" value={bean.beanDescription || ''} onChange={(e) => setBean({ ...bean, beanDescription: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 items-center justify-between">
            {error && <p className="text-sm text-red-500 text-right">{error}</p>}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleClose}>ביטול</Button>
              <Button onClick={handleSave}>{bean.id ? "שמור שינויים" : "הוסף פול"}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

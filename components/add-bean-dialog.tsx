
"use client";

import { useState, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { addBean, updateBean, getGlobalRoasters, getGlobalBeans, submitForVerification } from "@/lib/firestore";
import type { SavedBean, RoastLevel } from "@/lib/types";
import { RoastRatingInput } from "./roast-rating-input";
import { RoasterCombobox } from "./roaster-combobox";
import { BeanCombobox } from "./bean-combobox";
import roasteries from '@/roasteries.json';

interface AddBeanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeanAdded: () => void;
  beanToEdit: SavedBean | Partial<SavedBean> | null;
  onDialogClose: () => void;
}

const flavorTagsOptions = [
  "שוקולדי",
  "אגוזי",
  "פירותי",
  "הדרים",
  "פרחוני",
  "מתוק",
  "חמצמץ",
  "קרמל",
  "מתובל",
  "פירות יער",
  "דבש",
  "וניל",
  "פירות גלעין",
  "פירות טרופיים",
  "תה",
  "יין",
  "טופי",
  "קקאו",
  "פירות יבשים"
];

export function AddBeanDialog({
  open,
  onOpenChange,
  onBeanAdded,
  beanToEdit,
  onDialogClose,
}: AddBeanDialogProps) {
  const [bean, setBean] = useState<Partial<SavedBean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (beanToEdit && beanToEdit.id) { // Check for a full bean to edit
        setBean(beanToEdit);
      } else if (beanToEdit) { // Partial bean
        setBean({ ...beanToEdit, flavorTags: beanToEdit.flavorTags || []});
      } else { // For new beans
        setBean({ flavorTags: [], roastLevel: undefined, rating: undefined });
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

    setIsSaving(true);
    try {
      const beanToSave: Partial<SavedBean> = { ...bean };

      if (beanToSave.pricePaid && beanToSave.bagWeightGrams) {
        beanToSave.pricePerKilo = (beanToSave.pricePaid / beanToSave.bagWeightGrams) * 1000;
      }

      const isTestData = process.env.NODE_ENV === 'development' || 
                         process.env.NODE_ENV === 'test' || 
                         process.env.VITEST != null;

      const cleanBeanToSave = Object.fromEntries(
        Object.entries(beanToSave).filter(([_, value]) => value !== undefined)
      ) as Omit<SavedBean, "id" | "createdAt">;

      if (bean.id) {
        await updateBean(bean.id, cleanBeanToSave);
      } else {
        await addBean({ ...cleanBeanToSave, isTestData });
        
        // Quietly check references against global registries for the verification queue
        const globalRoasters = await getGlobalRoasters();
        const isRoasterVerified = roasteries.includes(cleanBeanToSave.roasterName) || globalRoasters.some(r => r.name === cleanBeanToSave.roasterName);
        if (!isRoasterVerified) {
            await submitForVerification('roaster', { name: cleanBeanToSave.roasterName, isTestData });
        }
        
        const globalBeansForRoaster = await getGlobalBeans(cleanBeanToSave.roasterName);
        const isBeanVerified = globalBeansForRoaster.some(b => b.beanName === cleanBeanToSave.beanName);
        if (!isBeanVerified) {
            await submitForVerification('bean', {
                roasterName: cleanBeanToSave.roasterName,
                beanName: cleanBeanToSave.beanName,
                flavorTags: cleanBeanToSave.flavorTags || [],
                roastLevel: cleanBeanToSave.roastLevel || null,
                isTestData
            });
        }
      }
      setBean({}); // Reset form
      onBeanAdded();
    } catch (err) {
      console.error('Error saving bean:', err);
      setError("שגיאה בשמירת הפול. נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onDialogClose();
    setBean({ flavorTags: [], roastLevel: undefined, rating: undefined }); // Reset form state on close
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
              <Label htmlFor="roasterName" id="roaster-label" className="text-right">שם בית הקלייה</Label>
              <RoasterCombobox 
                value={bean.roasterName || ""}
                onChange={(value) => setBean({ ...bean, roasterName: value })}
                aria-labelledby="roaster-label"
              />
            </div>
            <div>
              <Label id="beanName-label" className="text-right">שם הפול</Label>
              <BeanCombobox 
                roasterName={bean.roasterName}
                value={bean.beanName || ''}
                onChange={(value, metadata) => {
                    const updates: Partial<SavedBean> = { beanName: value };
                    
                    if (metadata) {
                        if (metadata.roastLevel) updates.roastLevel = metadata.roastLevel as RoastLevel;
                        if (metadata.flavorTags && metadata.flavorTags.length > 0) updates.flavorTags = metadata.flavorTags;
                    }
                    
                    setBean({ ...bean, ...updates });
                }}
                aria-labelledby="beanName-label"
              />
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
            <Label>ציון אישי</Label>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex gap-1 items-center relative group">
                <Slider 
                  dir="rtl"
                  min={0} 
                  max={5} 
                  step={0.5} 
                  value={[bean.rating || 0]} 
                  onValueChange={(val) => setBean({ ...bean, rating: val[0] === 0 ? undefined : val[0] })}
                  className="w-[180px] h-8 absolute inset-0 z-10 opacity-0 cursor-pointer"
                />
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const rating = bean.rating || 0;
                  const isFull = rating >= starIndex;
                  const isHalf = rating === starIndex - 0.5;
                  
                  return (
                    <div key={starIndex} className="relative w-8 h-8">
                       <Star className="absolute inset-0 h-8 w-8 text-[#EAE0D5]/20" />
                       {isFull && <Star className="absolute inset-0 h-8 w-8 fill-[#C67C4E] text-[#C67C4E]" />}
                       {isHalf && (
                         <Star 
                            className="absolute inset-0 h-8 w-8 fill-[#C67C4E] text-[#C67C4E]" 
                            style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                         />
                       )}
                    </div>
                  );
                })}
              </div>
              <span className="text-sm font-bold text-[#EAE0D5]/60 w-8">{bean.rating ? bean.rating.toFixed(1) : '-'}</span>
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
            <Label htmlFor="beanDescription" className="text-right">תיאור הפולים</Label>
            <Textarea id="beanDescription" value={bean.beanDescription || ''} onChange={(e) => setBean({ ...bean, beanDescription: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 items-center justify-between">
            {error && <p className="text-sm text-red-500 text-right">{error}</p>}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleClose}>ביטול</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    טוען...
                  </>
                ) : (
                  bean.id ? "שמור שינויים" : "הוסף פול"
                )}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

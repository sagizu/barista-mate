
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
import { addSavedBean, updateSavedBean } from "@/lib/storage";
import type { SavedBean } from "@/lib/types";
import type { RoastLevel } from "@/lib/dial-in";
import { cn } from "@/lib/utils";

interface AddBeanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeanAdded: () => void;
  beanToEdit: SavedBean | Partial<SavedBean> | null;
  onDialogClose: () => void;
}

const flavorTagsOptions = ["שוקולדי", "אגוזי", "פירותי", "פרחוני", "מתוק", "חמצמץ"];
const ROAST_OPTIONS: { value: RoastLevel; label: string }[] = [
  { value: "light", label: "בהירה" },
  { value: "medium", label: "בינונית" },
  { value: "dark", label: "כהה" },
];

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
      if (beanToEdit) {
        setBean(beanToEdit);
      } else {
        setBean({ flavorTags: [], roastLevel: "medium" });
      }
    }
  }, [open, beanToEdit]);

  const handleSave = () => {
    setError(null);
    if (!bean.beanName?.trim()) {
        setError('"שם הפול" הוא שדה חובה.');
        return;
    }

    if (bean.roasterName) {
      addStoredRoastery(bean.roasterName);
    }
    
    if (bean.id) {
      updateSavedBean(bean as SavedBean);
    } else {
      addSavedBean(bean as any);
    }
    setBean({}); // Reset form
    onBeanAdded();
  };

  const handleClose = () => {
    onDialogClose();
    setBean({ flavorTags: [] }); // Reset form state on close
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
             <div>
                <Label>דרגת קלייה</Label>
                <div className="inline-flex w-full rounded-lg border border-[#3E2C22] bg-[#15100d] p-0.5 mt-2" role="group">
                  {ROAST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBean({...bean, roastLevel: opt.value})}
                      className={cn(
                        "flex-1 min-w-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        bean.roastLevel === opt.value
                          ? "bg-[#C67C4E] text-white shadow"
                          : "text-[#EAE0D5] hover:bg-[#2a1d18]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>ביטול</Button>
              <Button onClick={handleSave}>{bean.id ? "שמור שינויים" : "הוסף פול"}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

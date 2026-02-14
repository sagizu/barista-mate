"use client";

import { useState, useCallback } from "react";
import { Calculator, Target, BookMarked } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { calculateDialIn, type DialInResult, type RoastLevel } from "@/lib/dial-in";
import { addDialInRecord, addSavedBean } from "@/lib/storage";
import { FLAVOR_TAGS } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROAST_OPTIONS: { value: RoastLevel; label: string }[] = [
  { value: "light", label: "בהירה" },
  { value: "medium", label: "בינונית" },
  { value: "dark", label: "כהה" },
];

const feedbackStyles = {
  perfect: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  too_fast: "bg-amber-900/40 text-amber-200 border-amber-700/50",
  too_slow: "bg-red-900/40 text-red-200 border-red-700/50",
};

export function SmartDialIn() {
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("medium");
  const [grindSetting, setGrindSetting] = useState("");
  const [dose, setDose] = useState("");
  const [yieldWeight, setYieldWeight] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState<DialInResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveRoaster, setSaveRoaster] = useState("");
  const [saveBeanName, setSaveBeanName] = useState("");
  const [saveGrind, setSaveGrind] = useState("");
  const [saveFlavorTags, setSaveFlavorTags] = useState<string[]>([]);

  const handleCalculate = useCallback(() => {
    const d = parseFloat(dose);
    const y = parseFloat(yieldWeight);
    const t = parseFloat(time);
    if (Number.isNaN(d) || Number.isNaN(y) || Number.isNaN(t)) return;
    const res = calculateDialIn(d, y, t, roastLevel);
    setResult(res ?? null);
    if (res) {
      addDialInRecord({
        dose: d,
        yield: y,
        time: t,
        ratio: res.ratio,
        feedback: res.feedback,
      });
    }
  }, [dose, yieldWeight, time, roastLevel]);

  const isValid = dose && yieldWeight && time;

  const openSaveDialog = () => {
    setSaveRoaster("");
    setSaveBeanName("");
    setSaveGrind(grindSetting);
    setSaveFlavorTags([]);
    setSaveDialogOpen(true);
  };

  const toggleFlavorTag = (tag: string) => {
    setSaveFlavorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#E6D2B5]">
          <Calculator className="h-5 w-5 text-[#C67C4E]" />
          מחשבון כיול
        </CardTitle>
        <CardDescription>
          הזן את נתוני הקפה (In), האספרסו (Out) והזמן כדי לקבל משוב לכיול.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>רמת קלייה</Label>
          <div className="inline-flex rounded-lg border border-[#3E2C22] bg-[#15100d] p-0.5" role="group" aria-label="רמת קלייה">
            {ROAST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoastLevel(opt.value)}
                className={cn(
                  "flex-1 min-w-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  roastLevel === opt.value
                    ? "bg-[#C67C4E] text-white shadow"
                    : "text-[#EAE0D5] hover:bg-[#2a1d18]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grind">דרגת טחינה</Label>
          <Input
            id="grind"
            type="text"
            inputMode="numeric"
            placeholder="למשל: 8 או 12"
            value={grindSetting}
            onChange={(e) => setGrindSetting(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dose">קפה נכנס (In)</Label>
            <Input
              id="dose"
              type="number"
              min="0"
              step="0.1"
              placeholder="18"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yield">אספרסו יצא (Out)</Label>
            <Input
              id="yield"
              type="number"
              min="0"
              step="0.1"
              placeholder="36"
              value={yieldWeight}
              onChange={(e) => setYieldWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">זמן (שניות)</Label>
            <Input
              id="time"
              type="number"
              min="0"
              step="0.5"
              placeholder="26"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={handleCalculate}
          disabled={!isValid}
          className="w-full sm:w-auto"
        >
          <Target className="h-4 w-4 ml-2" />
          חשב
        </Button>

        {result && (
          <div
            className={cn(
              "rounded-lg border p-4 space-y-2",
              feedbackStyles[result.feedback]
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{result.message}</span>
              {result.advice && (
                <Badge variant="secondary" className="text-xs">
                  {result.advice}
                </Badge>
              )}
            </div>
            <p className="text-sm opacity-90">
              יחס: <strong>1:{result.ratio}</strong> · חלון יעד:{" "}
              {result.targetMin}-{result.targetMax} שניות
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-[#C67C4E]/50 text-[#EAE0D5] hover:bg-[#2a1d18]"
              onClick={openSaveDialog}
            >
              <BookMarked className="h-4 w-4 ml-2" />
              שמור הגדרה לספרייה
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
      <DialogContent onClose={() => setSaveDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>שמור פולים חדשים</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roaster">בית קלייה</Label>
            <Input
              id="roaster"
              placeholder="למשל: Ruth Coffee"
              value={saveRoaster}
              onChange={(e) => setSaveRoaster(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bean-name">שם הפולים</Label>
            <Input
              id="bean-name"
              placeholder="למשל: Fuego Oro"
              value={saveBeanName}
              onChange={(e) => setSaveBeanName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="save-grind">דרגת טחינה</Label>
            <Input
              id="save-grind"
              type="text"
              placeholder="למשל: 8"
              value={saveGrind}
              onChange={(e) => setSaveGrind(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>פרופיל טעמים</Label>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFlavorTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    saveFlavorTags.includes(tag)
                      ? "border-[#C67C4E] bg-[#C67C4E]/30 text-[#E6D2B5]"
                      : "border-[#3E2C22] bg-[#15100d] text-[#EAE0D5]/80 hover:border-[#C67C4E]/50"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
            ביטול
          </Button>
          <Button
            onClick={() => {
              if (saveRoaster.trim() && saveBeanName.trim()) {
                addSavedBean({
                  roasterName: saveRoaster.trim(),
                  beanName: saveBeanName.trim(),
                  grindSetting: saveGrind.trim() || "—",
                  flavorTags: saveFlavorTags.length ? saveFlavorTags : undefined,
                });
                setSaveDialogOpen(false);
              }
            }}
            disabled={!saveRoaster.trim() || !saveBeanName.trim()}
          >
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

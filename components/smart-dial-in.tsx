
"use client";

import { useState, useCallback, useEffect } from "react";
import { Calculator, Target, BookMarked, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateDialIn, type DialInResult, type RoastLevel } from "@/lib/dial-in";
import { addDialInRecord, getGeneralSettings, getActiveBeanId, getStoredBeans } from "@/lib/storage";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { cn } from "@/lib/utils";
import type { SavedBean } from "@/lib/types";

const ROAST_OPTIONS: { value: RoastLevel; label: string }[] = [
  { value: 1, label: "בהירה" },
  { value: 3, label: "בינונית" },
  { value: 5, label: "כהה" },
];

const feedbackStyles = {
  perfect: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  too_fast: "bg-amber-900/40 text-amber-200 border-amber-700/50",
  too_slow: "bg-red-900/40 text-red-200 border-red-700/50",
};

export function SmartDialIn() {
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(3);
  const [grindSetting, setGrindSetting] = useState("");
  const [dose, setDose] = useState("");
  const [yieldWeight, setYieldWeight] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState<DialInResult | null>(null);
  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [activeBean, setActiveBean] = useState<SavedBean | null>(null);
  const [beanForDialog, setBeanForDialog] = useState<SavedBean | Partial<SavedBean> | null>(null);

  useEffect(() => {
    const settings = getGeneralSettings();
    setDose(String(settings.defaultDose));
    const calculatedYield = settings.defaultDose * settings.targetRatio;
    setYieldWeight(String(calculatedYield));

    const activeId = getActiveBeanId();
    if (activeId) {
      const beans = getStoredBeans();
      const currentBean = beans.find(b => b.id === activeId);
      if (currentBean) {
        setActiveBean(currentBean);
        if (currentBean.grindSetting) {
          setGrindSetting(currentBean.grindSetting);
        }
        if (currentBean.roastLevel) {
          setRoastLevel(currentBean.roastLevel);
        }
      }
    }
  }, []);

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

  const handleSaveToLibrary = () => {
    const beanData = activeBean 
      ? { ...activeBean, grindSetting, roastLevel } 
      : { grindSetting, roastLevel };
    setBeanForDialog(beanData);
    setAddBeanOpen(true);
  };

  const handleAddNewBean = () => {
    setBeanForDialog(null);
    setAddBeanOpen(true);
  }

  const handleDialogClose = () => {
    setAddBeanOpen(false);
    setBeanForDialog(null);
    // The main page reload on settings save will refresh the active bean info
  };

  const isValid = dose && yieldWeight && time;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNewBean} variant="outline">
          <PlusCircle className="h-4 w-4 ml-2" />
          הוסף פול חדש
        </Button>
      </div>
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
              value={grindSetting}
              onChange={(e) => setGrindSetting(e.target.value)}
              placeholder={activeBean?.grindSetting ? `מומלץ: ${activeBean.grindSetting}` : "למשל: 1.5"}
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
              </div>

              {result.advice && (
                  <p className="text-xl font-bold text-center py-2">{result.advice}</p>
              )}

              <p className="text-sm opacity-90">
                יחס: <strong>1:{result.ratio.toFixed(2)}</strong> · חלון יעד:{" "}
                {result.targetMin}-{result.targetMax} שניות
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-[#C67C4E]/50 text-[#EAE0D5] hover:bg-[#2a1d18]"
                onClick={handleSaveToLibrary}
              >
                <BookMarked className="h-4 w-4 ml-2" />
                {activeBean ? 'עדכן הגדרת טחינה' : 'שמור הגדרה לספרייה'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AddBeanDialog 
        open={addBeanOpen} 
        onOpenChange={setAddBeanOpen} 
        onBeanAdded={handleDialogClose}
        beanToEdit={beanForDialog}
        onDialogClose={handleDialogClose}
      />
    </>
  );
}

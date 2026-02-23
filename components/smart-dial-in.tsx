
"use client";

import { useState, useCallback, useEffect } from "react";
import { Calculator, Target, BookMarked } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateDialIn, type DialInResult } from "@/lib/dial-in";
import { addDialInRecord, getGeneralSettings, getActiveBeanId, getStoredBeans } from "@/lib/storage";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { cn } from "@/lib/utils";
import type { SavedBean } from "@/lib/types";

const feedbackStyles = {
  perfect: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  too_fast: "bg-amber-900/40 text-amber-200 border-amber-700/50",
  too_slow: "bg-red-900/40 text-red-200 border-red-700/50",
};

export function SmartDialIn() {
  const [grindSetting, setGrindSetting] = useState("");
  const [dose, setDose] = useState("");
  const [yieldWeight, setYieldWeight] = useState("");
  const [time, setTime] = useState("");
  const [targetMin, setTargetMin] = useState("25");
  const [targetMax, setTargetMax] = useState("30");
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
      }
    }
  }, []);

  const handleCalculate = useCallback(() => {
    const d = parseFloat(dose);
    const y = parseFloat(yieldWeight);
    const t = parseFloat(time);
    const tMin = parseFloat(targetMin);
    const tMax = parseFloat(targetMax);
    if (Number.isNaN(d) || Number.isNaN(y) || Number.isNaN(t) || Number.isNaN(tMin) || Number.isNaN(tMax)) return;
    const res = calculateDialIn(d, y, t, tMin, tMax);
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
  }, [dose, yieldWeight, time, targetMin, targetMax]);

  const handleSaveToLibrary = () => {
    if (!grindSetting.trim()) {
      return; 
    }
    
    let beanData: Partial<SavedBean> = { grindSetting };
    if (activeBean) {
      // Create a template from the active bean, but without its ID
      // so the dialog opens in "add" mode instead of "edit".
      const { id, ...beanTemplate } = activeBean;
      beanData = { ...beanTemplate, grindSetting };
    }

    setBeanForDialog(beanData);
    setAddBeanOpen(true);
  };

  const handleDialogClose = () => {
    setAddBeanOpen(false);
    setBeanForDialog(null);
    // The main page reload on settings save will refresh the active bean info
  };

  const isValid = dose && yieldWeight && time && targetMin && targetMax && grindSetting.trim();

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
            <Label>טווח זמן משוער (שניות)</Label>
            <p className="text-sm text-[#EAE0D5]/70 mb-2">הגדר את טווח הזמן שבמבחינתך הוא תקין לכיול טוב</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="targetMin" className="text-sm">מינימום</Label>
                <Input
                  id="targetMin"
                  type="number"
                  min="0"
                  step="0.5"
                  value={targetMin}
                  onChange={(e) => setTargetMin(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetMax" className="text-sm">מקסימום</Label>
                <Input
                  id="targetMax"
                  type="number"
                  min="0"
                  step="0.5"
                  value={targetMax}
                  onChange={(e) => setTargetMax(e.target.value)}
                  placeholder="30"
                />
              </div>
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
              placeholder={activeBean?.grindSetting ? `מומלץ: ${activeBean.grindSetting}` : ""}
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
                disabled={!dose || !yieldWeight || !time || !targetMin || !targetMax || !grindSetting.trim()}
              >
                <BookMarked className="h-4 w-4 ml-2" />
                שמור הגדרה לספרייה
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

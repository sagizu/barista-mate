
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Calculator, BookMarked, Timer, Play, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateSmartDialIn, type DialInResult, type DrinkType } from "@/lib/dial-in";
import { addDialInRecord } from "@/lib/firestore";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { RoastRatingInput } from "@/components/roast-rating-input";
import { cn } from "@/lib/utils";
import type { SavedBean, RoastLevel } from "@/lib/types";
import { Label } from "./ui/label";

import { RistrettoIcon } from "./ui/ristretto-icon";
import { EspressoIcon } from "./ui/espresso-icon";
import { LungoIcon } from "./ui/lungo-icon";

const feedbackStyles = {
  perfect: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  good: "bg-amber-900/40 text-amber-200 border-amber-700/50",
  bad: "bg-red-900/40 text-red-200 border-red-700/50",
};

const drinkOptions: { type: DrinkType, label: string, ratio: string, Icon: React.ElementType }[] = [
    { type: 'ristretto', label: 'ריסטרטו', ratio: '1:1.5', Icon: RistrettoIcon },
    { type: 'espresso', label: 'אספרסו', ratio: '1:2', Icon: EspressoIcon },
    { type: 'lungo', label: 'לונגו', ratio: '1:3', Icon: LungoIcon },
];

export function SmartDialIn() {
    const [drinkType, setDrinkType] = useState<DrinkType | null>(null);
    const [roastLevel, setRoastLevel] = useState<number>(0);
  
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
  
    const [result, setResult] = useState<DialInResult | null>(null);
    const [addBeanOpen, setAddBeanOpen] = useState(false);
    const [beanForDialog, setBeanForDialog] = useState<Partial<SavedBean> | null>(null);

  const handleTimerToggle = () => {
    if (isTimerRunning) {
      clearInterval(timerRef.current!);
      setIsTimerRunning(false);
      handleCalculate(timer);
    } else {
      setTimer(0);
      setResult(null);
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 0.1);
      }, 100);
    }
  };

  const handleCalculate = useCallback((finalTime: number) => {
    if (!drinkType || roastLevel === 0) return;
    const res = calculateSmartDialIn(drinkType, roastLevel, finalTime);
    setResult(res);
    addDialInRecord({
        drinkType,
        roastLevel,
        time: finalTime,
        targetTime: res.targetTime,
        feedback: res.feedback,
        advice: res.advice,
    });
  }, [drinkType, roastLevel]);

  const handleSaveToLibrary = () => {
    let beanData: Partial<SavedBean> = { roastLevel: roastLevel as RoastLevel };
    setBeanForDialog(beanData);
    setAddBeanOpen(true);
  };

  const handleDialogClose = () => {
    setAddBeanOpen(false);
    setBeanForDialog(null);
  };

  const isReady = drinkType && roastLevel > 0;
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#E6D2B5]">
            <Calculator className="h-5 w-5 text-[#C67C4E]" />
            כיול חכם
          </CardTitle>
          <CardDescription>
            בחר סוג משקה ודרגת קלייה, מדוד את זמן החילוץ וקבל המלצה מדויקת.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">1. בחר סוג משקה</Label>
            <div className="grid grid-cols-3 gap-2">
              {drinkOptions.map(({ type, label, ratio, Icon }) => (
                <Button key={type} variant={drinkType === type ? "default" : "outline"} onClick={() => setDrinkType(type)} className="flex-col h-32">
                  <Icon className="h-12 w-12 mb-1" />
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs opacity-80">{ratio}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">2. דרגת קלייה</Label>
            <RoastRatingInput rating={roastLevel} onRatingChange={setRoastLevel} />
          </div>
          
          <div className="text-center space-y-4">
            <Button onClick={handleTimerToggle} disabled={!isReady} size="lg" className="h-24 w-24 rounded-full flex-col gap-1 shadow-lg">
              {isTimerRunning ? <Square className="h-8 w-8" /> : <Timer className="h-8 w-8" />}
              <span>{isTimerRunning ? 'עצור' : 'התחל'}</span>
            </Button>
            <p className="text-5xl font-mono font-bold text-center text-white">{timer.toFixed(1)}s</p>
          </div>

          {result && (
            <div className={cn("rounded-lg border p-4 space-y-2", feedbackStyles[result.feedback])}>
              <p className="font-semibold text-center">{result.message}</p>
              {result.advice && <p className="text-xl font-bold text-center py-2">{result.advice}</p>}
              <p className="text-sm opacity-90 text-center">
                זמן יעד: <strong>{result.targetTime.toFixed(1)}s</strong> · בפועל: <strong>{result.actualTime.toFixed(1)}s</strong>
              </p>
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#C67C4E]/50 text-[#EAE0D5] hover:bg-[#2a1d18]"
                  onClick={handleSaveToLibrary}
                >
                  <BookMarked className="h-4 w-4 ml-2" />
                  שמור הגדרה לספרייה
                </Button>
              </div>
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

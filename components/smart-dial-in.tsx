
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Calculator, BookMarked, Timer, Play, Square, Target, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateSmartDialIn, type DialInResult, type DrinkType } from "@/lib/dial-in";
import { saveLastShot, updateBean } from "@/lib/firestore";
import { db, auth } from "@/firebase-config";
import { doc, getDoc } from "firebase/firestore";
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

const translateDrinkType = (type: DrinkType) => {
    switch (type) {
        case 'ristretto':
            return 'ריסטרטו';
        case 'espresso':
            return 'אספרסו';
        case 'lungo':
            return 'לונגו';
        default:
            return type;
    }
};

interface SmartDialInProps {
    activeBean?: SavedBean | null;
}

export function SmartDialIn({ activeBean }: SmartDialInProps = {}) {
    const [drinkType, setDrinkType] = useState<DrinkType | null>(null);
    const [roastLevel, setRoastLevel] = useState<number>(activeBean?.roastLevel || 0);
    const [grindInput, setGrindInput] = useState<string>(activeBean?.grindSetting || "");
    const [grindSaved, setGrindSaved] = useState(false);

    useEffect(() => {
        if (activeBean) {
            if (activeBean.roastLevel && roastLevel === 0) {
                setRoastLevel(activeBean.roastLevel);
            }
            setGrindInput(activeBean.grindSetting || "");
        }
    }, [activeBean?.id, activeBean?.roastLevel, activeBean?.grindSetting]);
  
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number | null>(null);
  
    const [result, setResult] = useState<DialInResult | null>(null);
    const [addBeanOpen, setAddBeanOpen] = useState(false);
    const [beanForDialog, setBeanForDialog] = useState<Partial<SavedBean> | null>(null);
    const [lastShot, setLastShot] = useState<any>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchLastShot = async () => {
            if (auth.currentUser) {
                const lastShotRef = doc(db, 'users', auth.currentUser.uid, 'lastShot', 'current');
                const docSnap = await getDoc(lastShotRef);
                if (docSnap.exists()) {
                    setLastShot(docSnap.data());
                }
            }
        };
        fetchLastShot();
    }, []);

  const handleCalculate = useCallback((finalTime: number) => {
    if (!drinkType || roastLevel === 0) return;
    const res = calculateSmartDialIn(drinkType, roastLevel, finalTime);
    setResult(res);
    const newShot = {
        drinkType,
        roastLevel,
        time: finalTime,
        targetTime: res.targetTime,
        feedback: res.feedback,
        advice: res.advice,
    };
    saveLastShot(newShot);
    setLastShot(newShot);
  }, [drinkType, roastLevel]);

  const handleTimerToggle = () => {
    if (isTimerRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsTimerRunning(false);
      const elapsed =
        startTimeRef.current !== null
          ? (Date.now() - startTimeRef.current) / 1000
          : timer;
      startTimeRef.current = null;
      setTimer(elapsed);
      handleCalculate(elapsed);
    } else {
      setTimer(0);
      setResult(null);
      setIsTimerRunning(true);
      const startedAt = Date.now();
      startTimeRef.current = startedAt;
      timerRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setTimer((Date.now() - startTimeRef.current) / 1000);
        }
      }, 100);
    }
  };

  const handleSaveToLibrary = () => {
    let beanData: Partial<SavedBean> = {
      roastLevel: roastLevel as RoastLevel,
      grindSetting: grindInput.trim() || undefined,
    };
    setBeanForDialog(beanData);
    setAddBeanOpen(true);
  };

  const handleUpdateActiveBeanGrind = async () => {
    if (!activeBean?.id) return;
    await updateBean(activeBean.id, { grindSetting: grindInput.trim() || null });
    setGrindSaved(true);
    setTimeout(() => setGrindSaved(false), 2500);
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
          {activeBean && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#C67C4E]/30 bg-[#C67C4E]/10 px-3 py-2 text-xs text-[#E6D2B5]">
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="h-3.5 w-3.5 text-[#C67C4E]" />
                פול פעיל: {activeBean.roasterName} · {activeBean.beanName}
              </span>
              {activeBean.grindSetting && (
                <span className="text-[#EAE0D5]/80">טחינה נוכחית: {activeBean.grindSetting}</span>
              )}
            </div>
          )}
          {lastShot && (
            <div className="text-sm text-gray-500 text-center">
                חישוב אחרון: {translateDrinkType(lastShot.drinkType)} | קלייה: {lastShot.roastLevel} | {lastShot.time.toFixed(1)} שניות
            </div>
          )}
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
              {activeBean && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Input
                    value={grindInput}
                    onChange={(e) => setGrindInput(e.target.value)}
                    placeholder="דרגת טחינה חדשה..."
                    className="h-8 max-w-[160px] text-xs bg-[#1F1712] border-[#C67C4E]/40 text-[#EAE0D5]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpdateActiveBeanGrind}
                    className="h-8 bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90 text-xs"
                  >
                    {grindSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 ml-1" />
                        עודכן!
                      </>
                    ) : (
                      "עדכן טחינה לפול הפעיל"
                    )}
                  </Button>
                </div>
              )}
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


"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Calculator, BookMarked, Timer, Play, Square, Target, Check, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateSmartDialIn, type DialInResult, type DrinkType } from "@/lib/dial-in";
import { saveLastShot, updateBean, getRecentShots } from "@/lib/firestore";
import { buildBeanShareUrl } from "@/lib/share-card";
import { signInWithGoogle } from "@/lib/auth";
import { db, auth } from "@/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { RoastRatingInput } from "@/components/roast-rating-input";
import { cn } from "@/lib/utils";
import type { SavedBean, RoastLevel, DialInRecord } from "@/lib/types";
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
    isDemo?: boolean;
}

export function SmartDialIn({ activeBean, isDemo = false }: SmartDialInProps = {}) {
    const [drinkType, setDrinkType] = useState<DrinkType | null>(null);
    const [roastLevel, setRoastLevel] = useState<number>(activeBean?.roastLevel || 0);
    const [grindInput, setGrindInput] = useState<string>(activeBean?.grindSetting || "");
    const [grindSaved, setGrindSaved] = useState(false);
    const [doseGrams, setDoseGrams] = useState<string>(activeBean?.dose ? String(activeBean.dose) : "");
    const [yieldGrams, setYieldGrams] = useState<string>("");
    const [recentShots, setRecentShots] = useState<DialInRecord[]>([]);

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

    useEffect(() => {
        if (!auth.currentUser || isDemo) return;
        getRecentShots?.(activeBean?.id || null).then((shots) => {
            if (Array.isArray(shots)) {
                setRecentShots(shots);
            }
        });
    }, [activeBean?.id, isDemo]);

  const handleCalculate = useCallback((finalTime: number) => {
    if (!drinkType || roastLevel === 0) return;
    const res = calculateSmartDialIn(drinkType, roastLevel, finalTime);
    setResult(res);
    const parsedDose = doseGrams ? parseFloat(doseGrams) : undefined;
    const parsedYield = yieldGrams ? parseFloat(yieldGrams) : undefined;
    const newShot = {
        drinkType,
        roastLevel,
        time: finalTime,
        targetTime: res.targetTime,
        feedback: res.feedback,
        advice: res.advice,
        ...(parsedDose && parsedDose > 0 ? { dose: parsedDose } : {}),
        ...(parsedYield && parsedYield > 0 ? { yieldGrams: parsedYield } : {}),
        ...(activeBean?.id ? { beanId: activeBean.id } : {}),
    };
    if (!isDemo) {
      saveLastShot(newShot);
      setRecentShots((prev) => [{ ...newShot, createdAt: new Date().toISOString() }, ...prev].slice(0, 5));
    }
    setLastShot(newShot);
  }, [drinkType, roastLevel, isDemo, doseGrams, yieldGrams, activeBean?.id]);

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

  const handleSaveToLibrary = async () => {
    if (isDemo && !auth.currentUser) {
      await signInWithGoogle();
      return;
    }
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

  const handleSharePerfectShot = async () => {
    if (!result) return;
    const ratioNum =
      doseGrams && yieldGrams && parseFloat(doseGrams) > 0 && parseFloat(yieldGrams) > 0
        ? ` (יחס 1:${(parseFloat(yieldGrams) / parseFloat(doseGrams)).toFixed(1)})`
        : '';
    const shareUrl = activeBean
      ? buildBeanShareUrl({
          roasterName: activeBean.roasterName,
          beanName: activeBean.beanName,
          roastLevel: activeBean.roastLevel,
          grindSetting: grindInput.trim() || activeBean.grindSetting,
          flavorTags: activeBean.flavorTags,
        })
      : 'https://barista-mate.vercel.app/';

    const text = activeBean
      ? `פגעתי בול עם ${activeBean.beanName} (${activeBean.roasterName}) ב-${result.actualTime.toFixed(1)} שניות${ratioNum}! ☕\n${grindInput.trim() ? `דרגת טחינה: ${grindInput.trim()}\n` : ''}לחץ להוסיף את המתכון לספרייה שלך:\n${shareUrl}`
      : `חילוץ מושלם של ${translateDrinkType(drinkType || 'espresso')} ב-${result.actualTime.toFixed(1)} שניות${ratioNum} עם Barista Mate ☕\n${shareUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'מתכון אספרסו מוצלח - Barista Mate', text, url: shareUrl });
      } catch {
        // User cancelled share
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('המתכון הועתק ללוח!');
    }
  };

  const parsedDose = doseGrams ? parseFloat(doseGrams) : 0;
  const parsedYield = yieldGrams ? parseFloat(yieldGrams) : 0;
  const liveRatio = parsedDose > 0 && parsedYield > 0 ? (parsedYield / parsedDose).toFixed(1) : null;

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dial-dose" className="text-xs text-[#EAE0D5]/80">מנת קפה (גרם · אופציונלי)</Label>
              <Input
                id="dial-dose"
                type="number"
                step="0.1"
                placeholder="למשל 18"
                value={doseGrams}
                onChange={(e) => setDoseGrams(e.target.value)}
                className="mt-1 h-9 bg-[#1F1712] border-[#3E2C22]"
              />
            </div>
            <div>
              <Label htmlFor="dial-yield" className="text-xs text-[#EAE0D5]/80">משקל משקה (גרם · אופציונלי)</Label>
              <Input
                id="dial-yield"
                type="number"
                step="0.1"
                placeholder="למשל 36"
                value={yieldGrams}
                onChange={(e) => setYieldGrams(e.target.value)}
                className="mt-1 h-9 bg-[#1F1712] border-[#3E2C22]"
              />
            </div>
          </div>
          {liveRatio && (
            <p className="text-xs text-center text-[#C67C4E] font-medium">
              יחס חליטה: <strong>1:{liveRatio}</strong> ({parsedDose}g → {parsedYield}g)
            </p>
          )}
          
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
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {result.feedback === 'perfect' && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90"
                    onClick={handleSharePerfectShot}
                  >
                    <Share2 className="h-4 w-4 ml-2" />
                    שתף מתכון מוצלח ☕
                  </Button>
                )}
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

          {recentShots.length > 0 && (
            <div className="pt-3 border-t border-[#3E2C22]/60 space-y-2">
              <p className="text-xs font-medium text-[#EAE0D5]/70">
                {activeBean ? `היסטוריית חליטות (${activeBean.beanName})` : 'חליטות אחרונות'}
              </p>
              <div className="flex flex-wrap gap-2">
                {recentShots.map((shot, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[#3E2C22] bg-[#0f0a08]/60 px-2.5 py-1 text-xs text-[#EAE0D5]/80"
                  >
                    {translateDrinkType(shot.drinkType)} · {Number(shot.time).toFixed(1)}s
                    {shot.dose && shot.yieldGrams ? ` · ${shot.dose}g→${shot.yieldGrams}g` : ''}
                  </span>
                ))}
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

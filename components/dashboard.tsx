'use client';

import { useState, useEffect, useMemo } from "react";
import { Coffee, Settings, User, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { format, parseISO, differenceInDays } from 'date-fns';
import { updateGeneralSettings, updateMaintenanceFrequencies } from "@/lib/firestore";
import { setupForegroundMessageHandler } from "@/lib/fcm";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SmartDialIn } from "@/components/smart-dial-in";
import { BeanLibrary } from "@/components/bean-library";
import { MaintenanceLog } from "@/components/maintenance-log";
import UserSettingsDialog from "@/components/user-settings-dialog";
import { HybridDateInput } from "@/components/hybrid-date-input";
import type { SavedBean, GeneralSettings } from "@/lib/types";
import { auth } from "@/firebase-config";
import { deleteUserData } from '@/lib/user-service';
import { FeedbackForm } from "./feedback-form";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("beans");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pulseClass, setPulseClass] = useState("animate-soft-pulse-initial");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFeedbackSent(localStorage.getItem("feedback_sent") === "true");
    }
  }, []);

  
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [settings, setSettings] = useState<GeneralSettings>({});
  const [settingsInput, setSettingsInput] = useState<GeneralSettings | null>(null);
  const [maintenanceFrequencies, setMaintenanceFrequencies] = useState<{[key: string]: number | ''}>({
    lastDescaling: 180,
    waterFilterLastChanged: 60,
    lastBackflush: 60,
  });
  const [maintenanceDates, setMaintenanceDates] = useState<any>({});

  useEffect(() => {
    if (!user) {
      setBeans([]);
      setSettings({});
      return;
    }

    // Feedback Pulse Animation Timer Logic
    const initialTimer = setTimeout(() => {
      setPulseClass("");
    }, 3600); // 3 iterations * 1.2s

    const intervalTimer = setInterval(() => {
      setPulseClass("animate-soft-pulse");
      setTimeout(() => {
        setPulseClass("");
      }, 1200);
    }, 60000); // Every 60s

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.data();
            setSettings(userData.settings?.general || {});
            if (userData.preferences?.maintenanceFrequencies) {
                setMaintenanceFrequencies(userData.preferences.maintenanceFrequencies);
            }
        }
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error("Dashboard user error:", error);
    });

    // Listener for beans
    const beansRef = collection(db, "users", user.uid, "beans");
    const q = query(beansRef, orderBy("createdAt", "desc"));
    const unsubscribeBeans = onSnapshot(q, (snapshot) => {
      const beansData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedBean));
      setBeans(beansData);
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error("Dashboard beans error:", error);
    });

    // Listener for maintenance dates
    const maintenanceRef = doc(db, 'users', user.uid, 'maintenance', 'log');
    const unsubscribeMaintenance = onSnapshot(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceDates(snapshot.data());
      } else {
        setMaintenanceDates({});
      }
    }, (error) => {
        if (error.code === 'permission-denied') return;
    });

    // Initialize foreground messaging listener
    const unsubscribeFCM = setupForegroundMessageHandler();

    return () => {
      unsubscribeUser();
      unsubscribeBeans();
      unsubscribeMaintenance();
      unsubscribeFCM();
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [user]);



  const activeBean = useMemo(() => {
    if (!settings.activeBeanId || beans.length === 0) return null;
    return beans.find(b => b.id === settings.activeBeanId) || null;
  }, [settings.activeBeanId, beans]);

  const hasOverdueMaintenance = useMemo(() => {
    const checkOverdue = (key: string, defaultFreq: number) => {
      const lastDate = maintenanceDates[key];
      if (!lastDate) return false; // User requested not to alert if no date is set
      const freq = maintenanceFrequencies[key] || defaultFreq;
      try {
        return differenceInDays(new Date(), parseISO(lastDate)) > Number(freq);
      } catch (e) {
        return false;
      }
    };
    
    return checkOverdue('lastDescaling', 180) || 
           checkOverdue('waterFilterLastChanged', 60) || 
           checkOverdue('lastBackflush', 60);
  }, [maintenanceDates, maintenanceFrequencies]);


  const openSettings = () => {
    setSettingsInput({
      machineName: settings.machineName || "",
      activeBeanId: settings.activeBeanId || null,
      activeBeanOpenedDate: settings.activeBeanOpenedDate || "",
    });
    setSettingsOpen(true);
  };

  const handleSettingChange = (field: keyof GeneralSettings, value: string | number | null) => {
    if (settingsInput) {
      setSettingsInput({ ...settingsInput, [field]: value });
    }
  };

  const handleFrequencyChange = (task: keyof typeof maintenanceFrequencies, value: number | '') => {
    setMaintenanceFrequencies(prev => ({...prev, [task]: value}));
  };
  
  const saveSettings = async () => {
    if (!settingsInput) return;
  
    const finalFrequencies = Object.fromEntries(
      Object.entries(maintenanceFrequencies).filter(([, value]) => value !== '').map(([key, value]) => [key, Number(value)])
    );
    
    await updateGeneralSettings(settingsInput);
    await updateMaintenanceFrequencies(finalFrequencies);
    
    setSettingsOpen(false);
    setSettingsInput(null);
  };
  
  const handleSignOut = async () => {
    if (user?.isAnonymous) {
      if (window.confirm("אתה מחובר כאורח. הנתונים שלך יימחקו לצמיתות אם תתנתק. האם להמשיך?")) {
        try {
          // Delete data from Firestore
          await deleteUserData(user.uid);
          // Delete anonymous user from Auth
          await user.delete();
        } catch (error) {
          console.error("Error deleting anonymous user:", error);
          // In case of error, perform regular sign out to avoid sticking the user
          await signOut(auth);
        }
      }
    } else {
      await signOut(auth);
    }
  };

return (
<div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08]">
      <header className="sticky top-0 z-40 w-full border-b border-[#3E2C22] bg-[#1F1712]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1F1712]/80">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">            
          {/* Left side: Logo and Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 text-[#E6D2B5] shrink-0">
                <Coffee className="h-7 w-7" />
                <span className="font-semibold text-lg">Barista Mate</span>
              </div>
              <div className="text-[#C67C4E] text-sm font-medium truncate hidden sm:inline-flex items-center space-x-2">
                {settings.machineName && <span title={settings.machineName}>· {settings.machineName}</span>}
                {activeBean && (
                  <span title={activeBean.beanName} className="inline-flex items-baseline gap-1">
                    <span>· {activeBean.beanName}</span>
                  </span>
                )}
              </div>
            </div>
            {/* Right side: Actions and User Menu */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFeedbackOpen(true)}
                aria-label="פידבק"
                className={`relative ${!feedbackSent ? pulseClass : ""} rounded-full`}
              >
                <MessageSquare className="h-5 w-5 text-[#E6D2B5]" />
                {!feedbackSent && <span className="absolute top-2 right-2 w-2 h-2 bg-[#C67C4E] rounded-full border border-[#1F1712] z-10" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={openSettings}
                aria-label="הגדרות"
              >
                <Settings className="h-5 w-5 text-[#E6D2B5]" />
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="תפריט משתמש"
                    >
                      <User className="h-5 w-5 text-[#E6D2B5]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          שלום, {user.displayName || 'משתמש'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground text-[#EAE0D5]/70">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#3E2C22]" />
                    <UserSettingsDialog userBeans={beans}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>הגדרות חשבון</span>
                      </DropdownMenuItem>
                    </UserSettingsDialog>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>התנתק</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>            
          </div>
        </header>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
          <DialogHeader>
            <DialogTitle>פידבק</DialogTitle>
          </DialogHeader>
          <FeedbackForm onSuccess={() => setFeedbackSent(true)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {settingsInput && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="bg-[#1F1712] border-[#3E2C22] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>הגדרות</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="machine-name">שם המכונה שלי</Label>
                <Input
                  id="machine-name"
                  value={settingsInput.machineName}
                  onChange={(e) => handleSettingChange("machineName", e.target.value)}
                />
              </div>
              <div className="space-y-4 pt-4 border-t border-[#3E2C22]">
                <h3 className="font-medium text-lg text-[#EAE0D5]">הגדרות תחזוקה</h3>
                <div className="space-y-2">
                    <Label htmlFor="descaling-frequency">תדירות ניקוי אבנית (בימים)</Label>
                    <Input
                        id="descaling-frequency"
                        type="number"
                        value={maintenanceFrequencies.lastDescaling}
                        onChange={(e) => handleFrequencyChange('lastDescaling', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="appearance-none"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="filter-frequency">תדירות החלפת פילטר (בימים)</Label>
                    <Input
                        id="filter-frequency"
                        type="number"
                        value={maintenanceFrequencies.waterFilterLastChanged}
                        onChange={(e) => handleFrequencyChange('waterFilterLastChanged', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="appearance-none"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="backflush-frequency">תדירות ניקוי ראש (בימים)</Label>
                    <Input
                        id="backflush-frequency"
                        type="number"
                        value={maintenanceFrequencies.lastBackflush}
                        onChange={(e) => handleFrequencyChange('lastBackflush', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="appearance-none"
                    />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(false)}
              >
                ביטול
              </Button>
              <Button onClick={saveSettings}>שמור</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <main className="flex-1 w-full container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={tab} onValueChange={setTab} className="w-full flex flex-col items-center">
          <TabsList className="grid w-full h-auto grid-cols-3 gap-2 sm:h-10 max-w-xl mb-6">
            <TabsTrigger value="beans">ספריית פולים</TabsTrigger>
            <TabsTrigger value="dial-in">כיול</TabsTrigger>
            <TabsTrigger value="maintenance" className="relative">
              תחזוקה
              {hasOverdueMaintenance && (
                <span className="absolute top-1 left-2 sm:left-4 w-2 h-2 rounded-full bg-[#C67C4E] animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="beans" className="w-full mt-0 overflow-y-auto">
            <BeanLibrary />
          </TabsContent>
          <TabsContent value="dial-in" className="w-full mt-0">
            <SmartDialIn />
          </TabsContent>
          <TabsContent value="maintenance" className="w-full mt-0">
            <MaintenanceLog />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="w-full border-t border-[#3E2C22] py-6 mt-auto bg-[#0f0a08]/80">
        <p className="text-center text-sm text-[#EAE0D5]/70">
          ❤️ Barista Mate · Built with
        </p>
      </footer>
    </div>
  );
}

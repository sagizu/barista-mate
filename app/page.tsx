'use client';

import { useState, useEffect, useMemo } from "react";
import { Coffee, Settings, User, LogOut } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { updateGeneralSettings } from "@/lib/firestore";
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
import { PeopleOrders } from "@/components/people-orders";
import { BeanLibrary } from "@/components/bean-library";
import { MaintenanceLog } from "@/components/maintenance-log";
import type { SavedBean, GeneralSettings } from "@/lib/types";

export default function Home() {
  const [user] = useAuthState(auth);
  const [tab, setTab] = useState("beans");
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [settings, setSettings] = useState<GeneralSettings>({});
  const [settingsInput, setSettingsInput] = useState<GeneralSettings | null>(null);

  useEffect(() => {
    if (!user) {
      setBeans([]);
      setSettings({});
      return;
    }

    // Listener for general settings
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      setSettings(snapshot.data() as GeneralSettings || {});
    });

    // Listener for beans
    const beansRef = collection(db, "users", user.uid, "beans");
    const q = query(beansRef, orderBy("createdAt", "desc"));
    const unsubscribeBeans = onSnapshot(q, (snapshot) => {
      const beansData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedBean));
      setBeans(beansData);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeBeans();
    };
  }, [user]);

  const activeBean = useMemo(() => {
    if (!settings.activeBeanId || beans.length === 0) return null;
    return beans.find(b => b.id === settings.activeBeanId) || null;
  }, [settings.activeBeanId, beans]);


  const openSettings = () => {
    setSettingsInput({
      machineName: settings.machineName || "",
      defaultDose: settings.defaultDose || 18,
      targetRatio: settings.targetRatio || 2,
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

  const saveSettings = async () => {
    if (!settingsInput) return;
    await updateGeneralSettings(settingsInput);
    setSettingsOpen(false);
    setSettingsInput(null);
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08]">
      <header className="sticky top-0 z-40 border-b border-[#3E2C22] bg-[#1F1712]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1F1712]/80">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
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
          <div className="flex items-center gap-1 shrink-0">
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

      {settingsInput && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
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
              <div>
                <Label htmlFor="active-bean">פולים פעילים</Label>
                <Select
                  id="active-bean"
                  value={settingsInput.activeBeanId || "-"}
                  onChange={(e) =>
                    handleSettingChange(
                      "activeBeanId",
                      e.target.value === "-" ? null : e.target.value
                    )
                  }
                >
                  <option value="-">ללא</option>
                  {beans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {bean.beanName} ({bean.roasterName})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="opened-date">תאריך פתיחת שקית</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="opened-date"
                    type="date"
                    value={settingsInput.activeBeanOpenedDate}
                    onChange={(e) =>
                      handleSettingChange("activeBeanOpenedDate", e.target.value)
                    }
                    disabled={
                      !settingsInput.activeBeanId ||
                      settingsInput.activeBeanId === "-"
                    }
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleSettingChange(
                        "activeBeanOpenedDate",
                        new Date().toISOString().split("T")[0]
                      )
                    }
                    disabled={
                      !settingsInput.activeBeanId ||
                      settingsInput.activeBeanId === "-"
                    }
                  >
                    היום
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="defaultDose">משקל קפה מועדף (גרם)</Label>
                <Input
                  id="defaultDose"
                  type="number"
                  value={settingsInput.defaultDose}
                  onChange={(e) =>
                    handleSettingChange("defaultDose", parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="targetRatio">יחס חילוץ מועדף</Label>
                <Input
                  id="targetRatio"
                  type="number"
                  step="0.1"
                  value={settingsInput.targetRatio}
                  onChange={(e) =>
                    handleSettingChange("targetRatio", parseFloat(e.target.value))
                  }
                />
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

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full h-auto grid-cols-2 gap-2 sm:h-10 sm:grid-cols-4 max-w-2xl">
            <TabsTrigger value="beans">ספריית פולים</TabsTrigger>
            <TabsTrigger value="dial-in">כיול</TabsTrigger>
            <TabsTrigger value="maintenance">תחזוקה</TabsTrigger>
            <TabsTrigger value="people">אנשים והזמנות</TabsTrigger>
          </TabsList>
          <TabsContent value="beans" className="mt-6 overflow-y-auto">
            <BeanLibrary />
          </TabsContent>
          <TabsContent value="dial-in" className="mt-6">
            <SmartDialIn />
          </TabsContent>
          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceLog />
          </TabsContent>
          <TabsContent value="people" className="mt-6 overflow-y-auto">
            <PeopleOrders />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-[#3E2C22] py-4 mt-12">
        <p className="text-center text-sm text-[#EAE0D5]/70">
          Barista Mate · Built with ❤️
        </p>
      </footer>
    </div>
  );
}

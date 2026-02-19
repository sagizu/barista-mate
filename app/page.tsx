'use client';

import { useState, useEffect } from "react";
import { Coffee, Settings, Calendar } from "lucide-react";
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
import {
  getMachineName,
  setMachineName,
  getGeneralSettings,
  setGeneralSettings,
  getStoredBeans,
  getActiveBeanId,
  setActiveBeanId,
  updateSavedBean,
  ACTIVE_BEAN_ID_KEY,
} from "@/lib/storage";
import type { SavedBean } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState("dial-in");
  const [machineName, setMachineNameState] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [activeBean, setActiveBean] = useState<SavedBean | null>(null);

  const [settingsInput, setSettingsInput] = useState<{
    name: string;
    dose: number;
    ratio: number;
    activeBeanId: string | null;
    openedDate: string;
  } | null>(null);

  const refreshActiveBean = () => {
    const activeId = getActiveBeanId();
    const allBeans = getStoredBeans();
    if (activeId) {
      const active = allBeans.find((b) => b.id === activeId) || null;
      setActiveBean(active);
    } else {
      setActiveBean(null);
    }
    setBeans(allBeans);
  };

  useEffect(() => {
    setMachineNameState(getMachineName());
    refreshActiveBean();
  }, []);

  const openSettings = () => {
    const currentSettings = getGeneralSettings();
    const allBeans = getStoredBeans();
    setBeans(allBeans);
    const activeId = getActiveBeanId();
    const activeBeanFromStorage = activeId ? allBeans.find((b) => b.id === activeId) : null;

    setSettingsInput({
      name: getMachineName(),
      dose: currentSettings.defaultDose,
      ratio: currentSettings.targetRatio,
      activeBeanId: activeId,
      openedDate: activeBeanFromStorage?.openedDate
        ? new Date(activeBeanFromStorage.openedDate).toISOString().split("T")[0]
        : "",
    });
    setSettingsOpen(true);
  };

 const handleSettingChange = (
    field: keyof NonNullable<typeof settingsInput>,
    value: string | number | null
  ) => {
    if (settingsInput) {
      const newSettings = { ...settingsInput, [field]: value };

      if (field === 'activeBeanId') {
        const selectedBean = beans.find((b) => b.id === value);
        newSettings.openedDate = selectedBean?.openedDate
          ? new Date(selectedBean.openedDate).toISOString().split('T')[0]
          : '';
      }

      setSettingsInput(newSettings);
    }
  };

  const saveSettings = () => {
    if (!settingsInput) return;

    const name = settingsInput.name.trim();
    setMachineName(name);
    setMachineNameState(name);

    setGeneralSettings({
      defaultDose: settingsInput.dose,
      targetRatio: settingsInput.ratio,
    });

    const newActiveBeanId = settingsInput.activeBeanId;

    if (newActiveBeanId && newActiveBeanId !== '-') {
      setActiveBeanId(newActiveBeanId);
      const selectedBean = beans.find(b => b.id === newActiveBeanId);

      if (selectedBean) {
        const updatedBean = { 
          ...selectedBean, 
          openedDate: settingsInput.openedDate 
            ? new Date(settingsInput.openedDate).toISOString() 
            : undefined
        };
        updateSavedBean(updatedBean as SavedBean);
      }
    } else {
      localStorage.removeItem(ACTIVE_BEAN_ID_KEY);
    }
    
    refreshActiveBean();
    setSettingsOpen(false);
    window.location.reload();
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
              {machineName && <span title={machineName}>· {machineName}</span>}
              {activeBean && (
                <span title={activeBean.beanName} className="inline-flex items-baseline gap-1">
                  <span>· {activeBean.beanName}</span>
                  {activeBean.openedDate && (
                    <span className="text-xs opacity-70">
                      ({new Date(activeBean.openedDate).toLocaleDateString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                      })})
                    </span>
                  )}
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
                  placeholder="למשל: Rocket Apartamento"
                  value={settingsInput.name}
                  onChange={(e) => handleSettingChange("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="active-bean">פולים פעילים</Label>
                <Select
                  id="active-bean"
                  value={settingsInput.activeBeanId || "-"}
                  onChange={(e) =>
                    handleSettingChange("activeBeanId", e.target.value)
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

              {settingsInput.activeBeanId && settingsInput.activeBeanId !== '-' && (
                <div>
                  <Label htmlFor="opened-date">תאריך פתיחת השקית</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="opened-date"
                      type="date"
                      value={settingsInput.openedDate}
                      onChange={(e) => handleSettingChange("openedDate", e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleSettingChange('openedDate', new Date().toISOString().split('T')[0])}
                      aria-label="Set today"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="defaultDose">משקל קפה מועדף (גרם)</Label>
                <Input
                  id="defaultDose"
                  type="number"
                  value={settingsInput.dose}
                  onChange={(e) =>
                    handleSettingChange("dose", parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="targetRatio">יחס חילוץ מועדף</Label>
                <Input
                  id="targetRatio"
                  type="number"
                  step="0.1"
                  value={settingsInput.ratio}
                  onChange={(e) =>
                    handleSettingChange("ratio", parseFloat(e.target.value))
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
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dial-in">כיול</TabsTrigger>
            <TabsTrigger value="beans">ספריית פולים</TabsTrigger>
            <TabsTrigger value="people">אנשים והזמנות</TabsTrigger>
            <TabsTrigger value="maintenance">תחזוקה</TabsTrigger>
          </TabsList>
          <TabsContent value="dial-in" className="mt-6">
            <SmartDialIn />
          </TabsContent>
          <TabsContent value="people" className="mt-6 overflow-y-auto">
            <PeopleOrders />
          </TabsContent>
          <TabsContent value="beans" className="mt-6 overflow-y-auto">
            <BeanLibrary />
          </TabsContent>
          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceLog />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-[#3E2C22] py-4 mt-12">
        <p className="text-center text-sm text-[#EAE0D5]/70">
          Barista Mate · נתונים נשמרים במכשיר (localStorage)
        </p>
      </footer>
    </div>
  );
}

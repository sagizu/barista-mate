"use client";

import { useState, useEffect } from "react";
import { Coffee, Settings, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MaintenanceDialog } from "@/components/maintenance-dialog";
import { getMachineName, setMachineName } from "@/lib/storage";

export default function Home() {
  const [tab, setTab] = useState("dial-in");
  const [machineName, setMachineNameState] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInput, setSettingsInput] = useState("");
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  useEffect(() => {
    setMachineNameState(getMachineName());
  }, []);

  const openSettings = () => {
    setSettingsInput(machineName);
    setSettingsOpen(true);
  };

  const saveMachineName = () => {
    const name = settingsInput.trim();
    setMachineName(name);
    setMachineNameState(name);
    setSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08]">
      <header className="sticky top-0 z-40 border-b border-[#3E2C22] bg-[#1F1712]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1F1712]/80">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-[#E6D2B5] shrink-0">
              <Coffee className="h-7 w-7" />
              <span className="font-semibold text-lg text-[#E6D2B5]">Barista Mate</span>
            </div>
            {machineName ? (
              <span className="text-[#C67C4E] text-sm font-medium truncate hidden sm:inline" title={machineName}>
                · {machineName}
              </span>
            ) : (
              <span className="text-[#EAE0D5]/80 text-sm hidden sm:inline">
                העוזר האישי לקפה
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setMaintenanceOpen(true)} aria-label="תחזוקה" className="shrink-0">
              <Wrench className="h-5 w-5 text-[#E6D2B5]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={openSettings} aria-label="הגדרות" className="shrink-0">
              <Settings className="h-5 w-5 text-[#E6D2B5]" />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent onClose={() => setSettingsOpen(false)}>
          <DialogHeader>
            <DialogTitle>הגדרות</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="machine-name">שם המכונה שלי</Label>
            <Input
              id="machine-name"
              placeholder="למשל: Rocket Apartamento"
              value={settingsInput}
              onChange={(e) => setSettingsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveMachineName()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              ביטול
            </Button>
            <Button onClick={saveMachineName}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaintenanceDialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="dial-in">כיול</TabsTrigger>
            <TabsTrigger value="people">אנשים והזמנות</TabsTrigger>
            <TabsTrigger value="beans">ספריית פולים</TabsTrigger>
          </TabsList>
          <TabsContent value="dial-in" className="mt-6">
            <SmartDialIn />
          </TabsContent>
          <TabsContent value="people" className="mt-6">
            <PeopleOrders />
          </TabsContent>
          <TabsContent value="beans" className="mt-6">
            <BeanLibrary />
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

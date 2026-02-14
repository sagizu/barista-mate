"use client";

import { useState, useEffect } from "react";
import { Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getMaintenanceDates,
  markMaintenanceDone,
  type MaintenanceDates,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

type MaintenanceKey = keyof MaintenanceDates;

interface MaintenanceItem {
  key: MaintenanceKey;
  label: string;
  intervalDays: number;
}

const ITEMS: MaintenanceItem[] = [
  { key: "lastBackflush", label: "ניקוי ראש (בקוואש)", intervalDays: 30 },
  { key: "lastWaterFilter", label: "החלפת פילטר מים", intervalDays: 90 },
  { key: "lastDescaling", label: "ניקוי אבנית", intervalDays: 180 },
];

function daysAgo(isoDate: string): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

type Status = "green" | "yellow" | "red";

function getStatus(daysAgoVal: number | null, intervalDays: number): Status {
  if (daysAgoVal === null) return "red"; // never done
  const pct = (daysAgoVal / intervalDays) * 100;
  if (pct < 50) return "green";
  if (pct <= 100) return "yellow";
  return "red";
}

const statusStyles: Record<Status, string> = {
  green: "border-emerald-700/50 bg-emerald-900/30 text-emerald-200",
  yellow: "border-amber-700/50 bg-amber-900/30 text-amber-200",
  red: "border-red-700/50 bg-red-900/30 text-red-200",
};

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceDialog({ open, onOpenChange }: MaintenanceDialogProps) {
  const [dates, setDates] = useState<MaintenanceDates | null>(null);

  useEffect(() => {
    if (open) setDates(getMaintenanceDates());
  }, [open]);

  const handleDidToday = (key: MaintenanceKey) => {
    const next = markMaintenanceDone(key);
    setDates(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#E6D2B5]">
            <Wrench className="h-5 w-5 text-[#C67C4E]" />
            יומן תחזוקה
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#EAE0D5]/90 mb-4">
          עקוב אחר מועדי הניקוי והתחזוקה של המכונה
        </p>
        <div className="space-y-3">
          {ITEMS.map((item) => {
            const iso = dates?.[item.key] ?? "";
            const days = daysAgo(iso);
            const status = getStatus(days, item.intervalDays);
            const label =
              days !== null
                ? `בוצע לפני ${days} ימים`
                : "טרם בוצע";
            return (
              <div
                key={item.key}
                className={cn(
                  "rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2",
                  statusStyles[status]
                )}
              >
                <div>
                  <p className="font-medium text-[#EAE0D5]">{item.label}</p>
                  <p className="text-xs opacity-90 mt-0.5">
                    מומלץ כל ~{item.intervalDays} יום · {label}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 bg-[#C67C4E] text-white hover:bg-amber-600"
                  onClick={() => handleDidToday(item.key)}
                >
                  בוצע היום
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

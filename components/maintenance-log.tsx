'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format, parseISO, differenceInDays } from 'date-fns';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore';
import { updateMaintenanceDates } from '@/lib/firestore';
import type { MaintenanceDates } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './empty-state';
import { Wrench, PlusCircle, Bell, BellRing } from 'lucide-react';
import { HybridDateInput } from './hybrid-date-input';
import { requestNotificationPermission } from '@/lib/fcm';

const MAINTENANCE_TASKS: {
  key: keyof MaintenanceDates;
  label: string;
  defaultFrequency: number;
}[] = [
  {
    key: 'lastDescaling',
    label: 'ניקוי אבנית (Descaling)',
    defaultFrequency: 180,
  },
  {
    key: 'waterFilterLastChanged',
    label: 'החלפת פילטר מים',
    defaultFrequency: 60,
  },
  {
    key: 'lastBackflush',
    label: 'ניקוי ראש עם טבליה (Backflush)',
    defaultFrequency: 60,
  },
];

function MaintenanceLogSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MaintenanceLog() {
  const [dates, setDates] = useState<MaintenanceDates>({});
  const [loading, setLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>({});
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      setDates({});
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const maintenanceRef = doc(db, 'users', user.uid, 'maintenance', 'log');

    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserPreferences(snapshot.data().preferences || {});
      }
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("MaintenanceLog user error:", error);
    });

    const unsubMaintenance = onSnapshot(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setDates(snapshot.data() as MaintenanceDates);
      } else {
        setDates({});
      }
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("MaintenanceLog log error:", error);
    });

    return () => {
      unsubUser();
      unsubMaintenance();
    };
  }, []);

  const handleDateChange = (key: keyof MaintenanceDates, value: string) => {
    setDates((prev) => ({ ...prev, [key]: value })); // Optimistic update
    updateMaintenanceDates({ [key]: value });
  };

  const handleMarkDone = (key: keyof MaintenanceDates) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleDateChange(key, today);
  };

  const handleEnablePush = async () => {
    if (!auth.currentUser) return;
    setPushLoading(true);
    const success = await requestNotificationPermission(auth.currentUser.uid);
    setPushEnabled(success);
    setPushLoading(false);
  };

  const handleDisablePush = async () => {
    if (!auth.currentUser) return;
    setPushLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        pushToken: deleteField()
      });
      setPushEnabled(false);
    } catch (e) {
      console.error(e);
    }
    setPushLoading(false);
  };

  const isOverdue = (
    taskKey: keyof MaintenanceDates,
    lastDate: string | undefined,
    taskDefaultFrequency: number
  ) => {
    if (!lastDate) return false; // User requested not to alert if no date is set
    const frequency =
      userPreferences?.maintenanceFrequencies?.[taskKey] ?? taskDefaultFrequency;
    try {
      return differenceInDays(new Date(), parseISO(lastDate)) > frequency;
    } catch (e) {
      return false;
    }
  };

  const isEmpty = !Object.values(dates).some(Boolean);

  if (loading) {
    return <MaintenanceLogSkeleton />;
  }

  if (isEmpty && !showDashboard) {
    return (
      <EmptyState
        icon={Wrench}
        title="שמור על התחזוקה של המכונה שלך"
        description="כאן תוכל לתעד ניקיונות, החלפת פילטרים ותחזוקה שוטפת כדי להבטיח קפה מעולה בכל פעם."
        action={
          <Button
            onClick={() => setShowDashboard(true)}
            className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90"
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            התחל לתעד
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications Banner */}
      <div className="bg-[#1F1712]/80 border border-[#3E2C22] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="bg-[#C67C4E]/20 p-2 rounded-full hidden sm:block">
            <Bell className="h-5 w-5 text-[#C67C4E]" />
          </div>
          <div>
            <h4 className="text-[#E6D2B5] font-semibold text-sm">התראות תחזוקה</h4>
            <p className="text-[#EAE0D5]/70 text-xs mt-1">קבלו תזכורת אוטומטית כשהגיע הזמן לנקות את המכונה.</p>
          </div>
        </div>
        
        {pushEnabled ? (
          <Button variant="outline" size="sm" onClick={handleDisablePush} disabled={pushLoading} className="border-[#3E2C22] text-[#EAE0D5] hover:text-red-400">
            ביטול התראות
          </Button>
        ) : (
          <Button onClick={handleEnablePush} disabled={pushLoading} size="sm" className="bg-[#C67C4E] hover:bg-[#C67C4E]/90 text-white shadow-lg">
             <Bell className="h-4 w-4 ml-2" />
             הפעלת התראות
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MAINTENANCE_TASKS.map(({ key, label, defaultFrequency }) => {
          const overdue = isOverdue(key, dates[key], defaultFrequency);
          const inputId = `date-${key}`;
          return (
            <Card key={key} className={overdue ? 'border-[#C67C4E]' : ''}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {label}
                  {overdue && <Badge className="bg-[#C67C4E]">הגיע הזמן!</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={inputId}>תאריך אחרון</Label>
                  <HybridDateInput
                    id={inputId}
                    value={dates[key]}
                    onChange={(newValue) => handleDateChange(key, newValue)}
                  />
                </div>
                <Button
                  onClick={() => handleMarkDone(key)}
                  className="w-full text-lg p-6"
                >
                  בוצע היום
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

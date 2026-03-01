'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO, differenceInDays } from 'date-fns';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateMaintenanceDates } from '@/lib/firestore';
import type { MaintenanceDates } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './empty-state';
import { Wrench, PlusCircle } from 'lucide-react';

const MAINTENANCE_TASKS: { key: keyof MaintenanceDates; label: string }[] = [
  { key: 'lastGroupHeadCleaning', label: 'ניקוי ראש' },
  { key: 'lastBackflush', label: 'ניקוי "עיוור" (Backflush)' },
  { key: 'lastDescaling', label: 'ניקוי אבנית' },
  { key: 'waterFilterLastChanged', label: 'החלפת פילטר מים' },
];

function MaintenanceLogSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setLoading(false);
        setDates({});
        return;
    };

    const maintenanceRef = doc(db, 'users', user.uid, 'maintenance', 'log');
    const unsubscribe = onSnapshot(maintenanceRef, (snapshot) => {
        if (snapshot.exists()) {
            setDates(snapshot.data() as MaintenanceDates);
        } else {
            setDates({});
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDateChange = (key: keyof MaintenanceDates, value: string) => {
    setDates(prev => ({...prev, [key]: value})); // Optimistic update
    updateMaintenanceDates({ [key]: value });
  }

  const handleMarkDone = (key: keyof MaintenanceDates) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleDateChange(key, today);
  };

  const isFilterOverdue = dates.waterFilterLastChanged && differenceInDays(new Date(), parseISO(dates.waterFilterLastChanged)) > 90;
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
                  <Button onClick={() => setShowDashboard(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
                      <PlusCircle className="h-4 w-4 ml-2" />
                      התחל לתעד
                  </Button>
              }
          />
      );
  }

  return (
    <div className="space-y-6">
      {isFilterOverdue && (
        <Card className="border-red-500/50 bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-400">אזהרה: החלף פילטר מים</CardTitle>
            <CardDescription className="text-red-400/80">
              עברו יותר מ-90 יום מאז החלפת פילטר המים האחרונה.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {MAINTENANCE_TASKS.map(({ key, label }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`date-${key}`}>תאריך אחרון</Label>
                <Input
                  id={`date-${key}`}
                  type="date"
                  value={(dates[key] && format(parseISO(dates[key] as string), 'yyyy-MM-dd')) || ''}
                  onChange={(e) => handleDateChange(key, e.target.value)}
                  className="text-lg p-4"
                />
              </div>
              <Button onClick={() => handleMarkDone(key)} className="w-full text-lg p-6">בוצע היום</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMaintenanceDates, markMaintenanceDone, MaintenanceDates } from '@/lib/storage';
import { format, parseISO, differenceInDays } from 'date-fns';

const MAINTENANCE_TASKS: { key: keyof MaintenanceDates; label: string }[] = [
  { key: 'lastGroupHeadCleaning', label: 'ניקוי ראש' },
  { key: 'lastBackflush', label: 'ניקוי "עיוור" (Backflush)' },
  { key: 'lastDescaling', label: 'ניקוי אבנית' },
  { key: 'waterFilterLastChanged', label: 'החלפת פילטר מים' },
];

export function MaintenanceLog() {
  const [dates, setDates] = useState<MaintenanceDates | null>(null);

  useEffect(() => {
    setDates(getMaintenanceDates());
  }, []);

  const handleMarkDone = (key: keyof MaintenanceDates) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newDates = markMaintenanceDone(key, today);
    setDates(newDates);
  };

  if (!dates) return null;

  const isFilterOverdue = dates.waterFilterLastChanged && differenceInDays(new Date(), parseISO(dates.waterFilterLastChanged)) > 90;

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
                  value={dates[key] ? format(parseISO(dates[key]), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDates({ ...dates, [key]: e.target.value })}
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

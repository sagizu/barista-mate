'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO, differenceInDays, parse } from 'date-fns';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateMaintenanceDates } from '@/lib/firestore';
import type { MaintenanceDates } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './empty-state';
import { Wrench, PlusCircle } from 'lucide-react';

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

// Sub-component for each maintenance task input to manage its own state
function MaintenanceTaskInput({
  id,
  dateValue,
  onDateChange,
}: {
  id: string;
  dateValue?: string;
  onDateChange: (newDate: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    try {
      if (dateValue) {
        setInputValue(format(parseISO(dateValue), 'dd/MM/yyyy'));
      } else {
        setInputValue('');
      }
    } catch (e) {
      setInputValue('');
    }
  }, [dateValue]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const textValue = e.target.value;
    // Also validate on blur if date is incomplete, e.g. "28/03/20"
    if (textValue.length > 0 && textValue.length < 10) {
      // Revert if not a full date
      try {
        if (dateValue) {
          setInputValue(format(parseISO(dateValue), 'dd/MM/yyyy'));
        } else {
          setInputValue('');
        }
      } catch (e) {
        setInputValue('');
      }
      return;
    }

    if (textValue === '') {
      onDateChange('');
      return;
    }
    const date = parse(textValue, 'dd/MM/yyyy', new Date());
    if (date instanceof Date && !isNaN(date.getTime())) {
      onDateChange(format(date, 'yyyy-MM-dd'));
    } else {
      // Revert to original value on invalid input
      try {
        if (dateValue) {
          setInputValue(format(parseISO(dateValue), 'dd/MM/yyyy'));
        } else {
          setInputValue('');
        }
      } catch (e) {
        setInputValue('');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // remove all non-digit characters
    const digits = e.target.value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setInputValue(formatted);
  };

  return (
    <Input
      id={id}
      type="text"
      placeholder="dd/MM/yyyy"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      className="text-lg p-4 w-full"
    />
  );
}

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
    });

    const unsubMaintenance = onSnapshot(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setDates(snapshot.data() as MaintenanceDates);
      } else {
        setDates({});
      }
      setLoading(false);
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

  const isOverdue = (
    taskKey: keyof MaintenanceDates,
    lastDate: string | undefined,
    taskDefaultFrequency: number
  ) => {
    if (!lastDate) return false;
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
                  <MaintenanceTaskInput
                    id={inputId}
                    dateValue={dates[key]}
                    onDateChange={(newValue) => handleDateChange(key, newValue)}
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

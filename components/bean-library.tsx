
"use client";

import { BookOpen, Trash2, PlusCircle, Pencil, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/firebase-config";
import { deleteBean } from "@/lib/firestore";
import { setStoredBeans } from "@/lib/storage";
import type { SavedBean } from "@/lib/types";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { RoastRatingInput } from "./roast-rating-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";

function BeanLibrarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="transition-colors">
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-t border-[#3E2C22] pt-4 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BeanLibrary() {
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [editingBean, setEditingBean] = useState<SavedBean | null>(null);


  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    };
    const beansRef = collection(db, "users", user.uid, "beans");
    const q = query(beansRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const beans: SavedBean[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedBean));
      setBeans(beans);
      setStoredBeans(beans);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (bean: SavedBean) => {
    setEditingBean(bean);
    setAddBeanOpen(true);
  };


  const handleDelete = async (id: string) => {
    await deleteBean(id);
  };

  const handleDialogClose = () => {
    setAddBeanOpen(false);
    setEditingBean(null);
  };

  const groupedBeans = beans.reduce((acc, bean) => {
    const roasteryName = bean.roasterName || "בתי קלייה לא ידועים";
    if (!acc[roasteryName]) {
      acc[roasteryName] = [];
    }
    acc[roasteryName].push(bean);
    return acc;
  }, {} as Record<string, SavedBean[]>);

  const calculatePricePerKg = (price?: number, weight?: number) => {
      if (!price || !weight) return null;
      const pricePerKg = (price / weight) * 1000;
      return pricePerKg.toFixed(2);
  }

  const renderContent = () => {
    if (loading) {
      return <BeanLibrarySkeleton />;
    }

    if (beans.length === 0) {
      return (
        <EmptyState
          icon={Coffee}
          title="הספרייה שלך מחכה לפולים הראשונים"
          description="כאן תוכל לנהל את כל סוגי הקפה שלך, ולשמור פרופילי טעם."
          action={
            <Button onClick={() => setAddBeanOpen(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
              <PlusCircle className="h-4 w-4 ml-2" />
              הוסף פול ראשון
            </Button>
          }
        />
      );
    }
    
    return (
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {Object.entries(groupedBeans).map(([roasteryName, beansInGroup]) => (
          <Card
            key={roasteryName}
            className="transition-colors hover:border-[#C67C4E]/30 flex flex-col"
          >
            <CardHeader>
              <CardTitle className="text-[#E6D2B5]" data-testid="roastery-title">{roasteryName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
             {beansInGroup.map(bean => {
                 const pricePerKg = calculatePricePerKg(bean.pricePaid, bean.bagWeightGrams);

                 return (
                    <div key={bean.id} className="border-t border-[#3E2C22] pt-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="font-semibold text-[#E6D2B5]">{bean.beanName}</p>
                                 <div className="flex flex-wrap items-center gap-4">
                                    {bean.grindSetting && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-[#C67C4E]/20 text-[#E6D2B5] border-[#C67C4E]/40 font-medium"
                                        >
                                            טחינה: {bean.grindSetting}
                                        </Badge>
                                    )}
                                    {bean.roastLevel && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[#EAE0D5]/80">קלייה:</span>
                                            <RoastRatingInput rating={bean.roastLevel} onRatingChange={() => {}} disabled />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-[#EAE0D5]/60 hover:text-[#C67C4E]"
                                onClick={() => handleEdit(bean)}
                                aria-label="ערוך"
                                >
                                <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-[#EAE0D5]/60 hover:text-red-300"
                                onClick={() => handleDelete(bean.id)}
                                aria-label="מחק"
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {bean.beanDescription && (
                            <p className="text-sm text-[#EAE0D5]/90 whitespace-pre-line mt-3">{bean.beanDescription}</p>
                        )}
                        {pricePerKg && (
                            <div className="text-sm text-[#EAE0D5]/80 mt-2 font-medium">
                                <span className="font-bold text-[#C67C4E]">{pricePerKg}₪</span> / לק"ג
                            </div>
                        )}
                        {bean.flavorTags && bean.flavorTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-3">
                            {bean.flavorTags.map((tag) => (
                                <span
                                key={tag}
                                className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2 py-0.5 text-xs text-[#E6D2B5]"
                                >
                                {tag}
                                </span>
                            ))}
                            </div>
                        )}
                    </div>
                 )
            })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#C67C4E]" />
                ספריית פולים
            </h2>
            <Button onClick={() => setAddBeanOpen(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
                <PlusCircle className="h-4 w-4 ml-2" />
                הוסף פול
            </Button>
        </div>
        
        {renderContent()}

      </div>
      <AddBeanDialog
        open={addBeanOpen}
        onOpenChange={setAddBeanOpen}
        onBeanAdded={handleDialogClose}
        beanToEdit={editingBean}
        onDialogClose={handleDialogClose}
      />
    </>
  );
}

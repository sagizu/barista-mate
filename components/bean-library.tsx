
"use client";

import { useState, useEffect } from "react";
import { BookOpen, Trash2, ExternalLink, PlusCircle, Pencil } from "lucide-react"; // Removed CalendarIcon
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStoredBeans, removeSavedBean } from "@/lib/storage";
import type { SavedBean } from "@/lib/types";
import { AddBeanDialog } from "@/components/add-bean-dialog";

export function BeanLibrary() {
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [editingBean, setEditingBean] = useState<SavedBean | null>(null);

  const refreshBeans = () => {
    setBeans(getStoredBeans());
  };

  useEffect(() => {
    refreshBeans();
  }, []);

  const handleEdit = (bean: SavedBean) => {
    setEditingBean(bean);
    setAddBeanOpen(true);
  };

  const handleDelete = (id: string) => {
    removeSavedBean(id);
    refreshBeans();
  };

  const handleDialogClose = (addedOrUpdated: boolean) => {
    setAddBeanOpen(false);
    setEditingBean(null);
    if (addedOrUpdated) {
      refreshBeans();
    }
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

        {beans.length === 0 ? (
             <div className="rounded-xl border border-[#3E2C22] bg-[#1F1712]/80 backdrop-blur-sm p-8 text-center shadow-lg">
                <BookOpen className="mx-auto h-12 w-12 text-[#EAE0D5]/50 mb-3" />
                <p className="text-[#E6D2B5] font-medium">אין פולים בספרייה</p>
                <p className="text-sm text-[#EAE0D5]/70 mt-1">
                שמור הגדרת כיול מוצלחת מהמחשבון כדי לזכור את דרגת הטחינה לכל פול
                </p>
            </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {Object.entries(groupedBeans).map(([roasteryName, beansInGroup]) => (
              <Card
                key={roasteryName}
                className="transition-colors hover:border-[#C67C4E]/30 flex flex-col"
              >
                <CardHeader>
                    <CardTitle className="text-[#E6D2B5]">{roasteryName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                 {beansInGroup.map(bean => {
                     const pricePerKg = calculatePricePerKg(bean.pricePaid, bean.bagWeightGrams);
                     return (
                        <div key={bean.id} className="border-t border-[#3E2C22] pt-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1.5">
                                    <p className="font-semibold text-[#E6D2B5]">{bean.beanName}</p>
                                     <Badge
                                        variant="secondary"
                                        className="bg-[#C67C4E]/20 text-[#E6D2B5] border-[#C67C4E]/40 font-medium"
                                    >
                                        טחינה: {bean.grindSetting}
                                    </Badge>
                                </div>
                                <div className="flex gap-1">
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
                                <p className="text-sm text-[#EAE0D5]/90 whitespace-pre-line mt-2">{bean.beanDescription}</p>
                            )}
                            {(bean.pricePaid && bean.bagWeightGrams) && (
                                <div className="text-sm text-[#EAE0D5]/80 mt-2">
                                    <span>{bean.pricePaid}₪ לשקית של {bean.bagWeightGrams} גרם</span>
                                    {pricePerKg && <span> · <span className="font-medium text-[#C67C4E]">{pricePerKg}₪</span> לק"ג</span>}
                                </div>
                            )}
                            {bean.roasteryLink && (
                                <a
                                href={bean.roasteryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-[#C67C4E] hover:underline mt-2"
                                >
                                <ExternalLink className="h-4 w-4" />
                                קישור לבית הקלייה
                                </a>
                            )}
                            {bean.flavorTags && bean.flavorTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-2">
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
        )}
      </div>
      <AddBeanDialog
        open={addBeanOpen}
        onOpenChange={setAddBeanOpen}
        onBeanAdded={() => handleDialogClose(true)}
        beanToEdit={editingBean}
        onDialogClose={() => handleDialogClose(false)}
      />
    </>
  );
}

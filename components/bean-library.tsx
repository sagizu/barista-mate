"use client";

import { useState, useEffect } from "react";
import { BookOpen, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStoredBeans, removeSavedBean } from "@/lib/storage";
import type { SavedBean } from "@/lib/types";

export function BeanLibrary() {
  const [beans, setBeans] = useState<SavedBean[]>([]);

  useEffect(() => {
    setBeans(getStoredBeans());
  }, []);

  const handleDelete = (id: string) => {
    removeSavedBean(id);
    setBeans(getStoredBeans());
  };

  if (beans.length === 0) {
    return (
      <div className="rounded-xl border border-[#3E2C22] bg-[#1F1712]/80 backdrop-blur-sm p-8 text-center shadow-lg">
        <BookOpen className="mx-auto h-12 w-12 text-[#EAE0D5]/50 mb-3" />
        <p className="text-[#E6D2B5] font-medium">אין פולים בספרייה</p>
        <p className="text-sm text-[#EAE0D5]/70 mt-1">
          שמור הגדרת כיול מוצלחת מהמחשבון כדי לזכור את דרגת הטחינה לכל פול
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-[#C67C4E]" />
        ספריית פולים
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {beans.map((bean) => (
          <Card
            key={bean.id}
            className="transition-colors hover:border-[#C67C4E]/30"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#E6D2B5]">{bean.beanName}</p>
                <p className="text-sm text-[#EAE0D5]/80">{bean.roasterName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-[#EAE0D5]/60 hover:text-red-300"
                onClick={() => handleDelete(bean.id)}
                aria-label="מחק"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge
                variant="secondary"
                className="bg-[#C67C4E]/20 text-[#E6D2B5] border-[#C67C4E]/40 font-medium"
              >
                טחינה: {bean.grindSetting}
              </Badge>
              {bean.flavorTags && bean.flavorTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

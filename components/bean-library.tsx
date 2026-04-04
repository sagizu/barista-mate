
"use client";

import { BookOpen, Trash2, PlusCircle, Pencil, Coffee, Filter, X, Share2, Star, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db, auth } from "@/firebase-config";
import { deleteBean, updateGeneralSettings } from "@/lib/firestore";
import { format } from "date-fns";
import { setStoredBeans } from "@/lib/storage";
import type { SavedBean } from "@/lib/types";
import { AddBeanDialog } from "@/components/add-bean-dialog";
import { HybridDateInput } from "@/components/hybrid-date-input";
import { RoastRatingInput } from "./roast-rating-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RoasterCombobox } from "./roaster-combobox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { CommunitySpotlight } from "./community-spotlight";
import { BeanSuggestions } from "./bean-suggestions";

const flavorTagsOptions = [
  "שוקולדי", "אגוזי", "פירותי", "הדרים", "פרחוני", "מתוק", "חמצמץ", 
  "קרמל", "מתובל", "פירות יער", "דבש", "וניל", "פירות גלעין", 
  "פירות טרופיים", "תה", "יין", "טופי", "קקאו", "פירות יבשים"
];

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
  const [filteredBeans, setFilteredBeans] = useState<SavedBean[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [editingBean, setEditingBean] = useState<SavedBean | null>(null);
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterRoastery, setFilterRoastery] = useState<string | null>(null);
  const [filterFlavorTags, setFilterFlavorTags] = useState<string[]>([]);
  const [filterRoastLevel, setFilterRoastLevel] = useState<[number, number]>([1, 5]);
  const [filterPricePerKilo, setFilterPricePerKilo] = useState<[number, number]>([0, 500]);
  
  const [activeBeanId, setActiveBeanId] = useState<string | null>(null);
  const [activeOpenedDate, setActiveOpenedDate] = useState<string>("");

  const handleClearFilters = () => {
    setFilterRoastery(null);
    setFilterFlavorTags([]);
    setFilterRoastLevel([1, 5]);
    setFilterPricePerKilo([0, 500]);
  };

  useEffect(() => {
    let newFilteredBeans = [...beans];

    if (filterRoastery) {
      newFilteredBeans = newFilteredBeans.filter(bean => bean.roasterName === filterRoastery);
    }

    if (filterFlavorTags.length > 0) {
      newFilteredBeans = newFilteredBeans.filter(bean => 
        filterFlavorTags.some(tag => bean.flavorTags?.includes(tag))
      );
    }

    if (filterRoastLevel[0] !== 1 || filterRoastLevel[1] !== 5) {
        newFilteredBeans = newFilteredBeans.filter(bean => 
            bean.roastLevel && bean.roastLevel >= filterRoastLevel[0] && bean.roastLevel <= filterRoastLevel[1]
        );
    }

    if (filterPricePerKilo[0] !== 0 || filterPricePerKilo[1] !== 500) {
        newFilteredBeans = newFilteredBeans.filter(bean => {
            if (!bean.pricePerKilo) return false;
            
            return bean.pricePerKilo >= filterPricePerKilo[0] && bean.pricePerKilo <= filterPricePerKilo[1];
        });
    }

    setFilteredBeans(newFilteredBeans);
  }, [beans, filterRoastery, filterFlavorTags, filterRoastLevel, filterPricePerKilo]);

  const toggleFlavorTagFilter = (tag: string) => {
    setFilterFlavorTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    };

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
        const data = snapshot.data()?.settings?.general;
        setActiveBeanId(data?.activeBeanId || null);
        setActiveOpenedDate(data?.activeBeanOpenedDate || "");
    });

    const beansRef = collection(db, "users", user.uid, "beans");
    const q = query(beansRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let beansFromDb = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedBean));
      
      // Sort beans by roaster name then by bean name
      beansFromDb.sort((a, b) => {
        const roasterNameA = a.roasterName?.toLowerCase() || '';
        const roasterNameB = b.roasterName?.toLowerCase() || '';
        const beanNameA = a.beanName?.toLowerCase() || '';
        const beanNameB = b.beanName?.toLowerCase() || '';

        if (roasterNameA < roasterNameB) return -1;
        if (roasterNameA > roasterNameB) return 1;
        if (beanNameA < beanNameB) return -1;
        if (beanNameA > beanNameB) return 1;
        return 0;
      });

      setBeans(beansFromDb);
      setFilteredBeans(beansFromDb); // Initially, filtered beans are all beans
      setStoredBeans(beansFromDb);
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("BeanLibrary error:", error);
    });
    return () => {
       unsubscribe();
       unsubscribeUser();
    }
  }, []);

  const handleSetActive = async (id: string | null) => {
     if (!auth.currentUser) return;
     if (id) {
         await updateGeneralSettings({ activeBeanId: id, activeBeanOpenedDate: format(new Date(), 'yyyy-MM-dd') });
     } else {
         await updateGeneralSettings({ activeBeanId: null, activeBeanOpenedDate: "" });
     }
  };

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

  const handleShare = async (bean: SavedBean) => {
    const shareText = `המלצת קפה מהספרייה שלי ב-Barista Mate ☕:\n${bean.roasterName} - ${bean.beanName}\nטעמים: ${bean.flavorTags?.join(', ') || 'אין טעמים מוגדרים'}\n\nלניהול ספריית הפולים האישית שלכם: https://barista-mate.vercel.app/`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'המלצת קפה - Barista Mate',
          text: shareText,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("הטקסט הועתק ללוח!");
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    } else {
      alert("השיתוף וההעתקה זמינים רק בחיבור מאובטח (HTTPS) או דרך הדפדפן שלך.");
    }
  };

  const otherBeans = filteredBeans.filter(b => b.id !== activeBeanId);
  const activeBean = filteredBeans.find(b => b.id === activeBeanId);

  const groupedBeans = otherBeans.reduce((acc, bean) => {
    const roasteryName = bean.roasterName || "בתי קלייה לא ידועים";
    if (!acc[roasteryName]) {
      acc[roasteryName] = [];
    }
    acc[roasteryName].push(bean);
    return acc;
  }, {} as Record<string, SavedBean[]>);

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
     if (filteredBeans.length === 0) {
      return (
        <EmptyState
          icon={Coffee}
          title="לא נמצאו פולים התואמים לחיפוש"
          description="נסה להרחיב את תנאי הסינון או הוסף פולים חדשים לספרייה."
          action={
            <Button onClick={handleClearFilters} variant="outline">
              <X className="h-4 w-4 ml-2" />
              נקה סינונים
            </Button>
          }
        />
      );
    }
    
    const sortedGroups = Object.entries(groupedBeans).sort(([roasterA], [roasterB]) => roasterA.localeCompare(roasterB));

    const renderBeanDetails = (bean: SavedBean) => {
        const isActive = bean.id === activeBeanId;
        return (
            <div key={bean.id} className={!isActive ? "border-t border-[#3E2C22] pt-4 first:border-0 first:pt-0" : ""}>
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#E6D2B5] text-lg">{bean.beanName}</p>
                            {isActive && (
                                <Badge 
                                    className="bg-[#C67C4E] hover:bg-red-500 text-white select-none whitespace-nowrap cursor-pointer transition-colors"
                                    onClick={() => handleSetActive(null)}
                                    title="לחץ כדי להסיר פול פעיל"
                                >
                                    <Target className="h-3 w-3 mr-1" /> פעיל כרגע
                                </Badge>
                            )}
                        </div>
                        {isActive && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[#EAE0D5]/70 whitespace-nowrap">נפתח בתאריך:</span>
                                <div className="w-[130px]">
                                <HybridDateInput 
                                    id={`date-${bean.id}`}
                                    value={activeOpenedDate}
                                    onChange={(newVal) => updateGeneralSettings({ activeBeanOpenedDate: newVal })}
                                    className="h-7 py-0 px-2 text-xs bg-transparent border-[#C67C4E]/30 text-[#E6D2B5] focus-visible:ring-[#C67C4E]/50 focus-visible:ring-offset-0 focus:border-[#C67C4E]"
                                />
                                </div>
                            </div> 
                        )}
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
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-[#EAE0D5]/60 hover:text-[#C67C4E]"
                        onClick={() => handleShare(bean)}
                        aria-label="שתף"
                        >
                        <Share2 className="h-4 w-4" />
                        </Button>
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

                {bean.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-3">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((starIndex) => {
                                const rating = bean.rating || 0;
                                const isFull = rating >= starIndex;
                                const isHalf = rating === starIndex - 0.5;
                                return (
                                    <div key={starIndex} className="relative w-4 h-4">
                                        <Star className="absolute inset-0 h-4 w-4 text-[#EAE0D5]/20" />
                                        {isFull && <Star className="absolute inset-0 h-4 w-4 fill-[#C67C4E] text-[#C67C4E]" />}
                                        {isHalf && (
                                            <Star 
                                                className="absolute inset-0 h-4 w-4 fill-[#C67C4E] text-[#C67C4E]" 
                                                style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <span className="text-xs font-bold text-[#EAE0D5]/50 ml-1">{bean.rating.toFixed(1)}</span>
                    </div>
                )}

                {bean.pricePerKilo && (
                    <div className="text-sm text-[#EAE0D5]/80 mt-2 font-medium">
                        <span className="font-bold text-[#C67C4E]">{bean.pricePerKilo.toFixed(2)}₪</span> / לק"ג
                    </div>
                )}
                {(!isActive || (bean.flavorTags && bean.flavorTags.length > 0)) && (
                    <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[#3E2C22]/30">
                        <div className="flex-grow">
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
                        </div>
                        {!isActive && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 h-7 px-3 text-[#C67C4E] border-[#C67C4E]/30 hover:bg-[#C67C4E]/10 text-xs shadow-none"
                                onClick={() => handleSetActive(bean.id)}
                            >
                                הגדר כפעיל
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
      <div className="space-y-8">
        {activeBean && (
            <div className="space-y-4">
               <h2 className="text-xl font-bold text-[#C67C4E] flex items-center gap-2">
                  <Target className="h-6 w-6" /> הפול הפעיל שלך
               </h2>
               <Card className="border-[#C67C4E] shadow-[0_0_15px_rgba(198,124,78,0.15)] flex flex-col bg-[#C67C4E]/5">
                 <CardHeader>
                   <CardTitle className="text-[#E6D2B5]">{activeBean.roasterName}</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 flex-grow">
                   {renderBeanDetails(activeBean)}
                 </CardContent>
               </Card>
            </div>
        )}

        {sortedGroups.length > 0 && (
            <div className="space-y-4">
                {activeBean && <h2 className="text-xl font-bold text-[#E6D2B5]">📚 ספריית הפולים</h2>}
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {sortedGroups.map(([roasteryName, beansInGroup]) => (
                        <Card key={roasteryName} className="transition-colors flex flex-col hover:border-[#C67C4E]/30">
                            <CardHeader>
                                <CardTitle className="text-[#E6D2B5]" data-testid="roastery-title">{roasteryName}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                {beansInGroup.map(bean => renderBeanDetails(bean))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full md:max-w-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#C67C4E]" />
                ספריית פולים
            </h2>
            <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {isFiltersOpen ? "הסתר סינון" : "הצג סינון"}
                </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-4">
              <div className="p-6 bg-[#1F1712] border border-[#3E2C22] rounded-lg shadow-lg space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#E6D2B5]">סינון פולים</h3>
                      <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                          <X className="h-4 w-4" />
                          נקה
                      </Button>
                  </div>

                  <div>
                      <Label className="text-right">בית קלייה</Label>
                       <RoasterCombobox 
                          value={filterRoastery || ""}
                          onChange={(value) => setFilterRoastery(value === "all" ? null : value)}
                      />
                  </div>

                   <div>
                      <Label>פרופיל טעמים</Label>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {flavorTagsOptions.map((tag) => (
                          <Button
                            key={tag}
                            variant={filterFlavorTags.includes(tag) ? "default" : "outline"}
                            onClick={() => toggleFlavorTagFilter(tag)}
                            className="rounded-full text-xs h-8"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                  <div>
                      <Label>דרגת קלייה: <span className="font-bold">{filterRoastLevel[0]} - {filterRoastLevel[1]}</span></Label>
                      <Slider
                          min={1} max={5} step={1}
                          value={[filterRoastLevel[0], filterRoastLevel[1]]}
                          onValueChange={(value) => setFilterRoastLevel([value[0], value[1]])}
                          className="mt-2"
                          dir="rtl"
                      />
                  </div>
                  
                  <div>
                      <Label>מחיר לק"ג (₪): <span className="font-bold">{filterPricePerKilo[0]} - {filterPricePerKilo[1]}</span></Label>
                       <Slider
                          min={0} max={500} step={10}
                          value={[filterPricePerKilo[0], filterPricePerKilo[1]]}
                          onValueChange={(value) => setFilterPricePerKilo([value[0], value[1]])}
                          className="mt-2"
                          dir="rtl"
                      />
                  </div>
              </div>
          </CollapsibleContent>
      </Collapsible>

      <div className="flex-grow">
        <div className="flex justify-end mb-4">
            <Button onClick={() => setAddBeanOpen(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
                <PlusCircle className="h-4 w-4 ml-2" />
                הוסף פול
            </Button>
        </div>
        {renderContent()}
        <BeanSuggestions userBeans={beans} />
        <CommunitySpotlight />
      </div>

      <AddBeanDialog
        open={addBeanOpen}
        onOpenChange={setAddBeanOpen}
        onBeanAdded={handleDialogClose}
        beanToEdit={editingBean}
        onDialogClose={handleDialogClose}
      />
    </div>
  );
}

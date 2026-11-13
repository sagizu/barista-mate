
"use client";

import { BookOpen, Trash2, PlusCircle, Pencil, Coffee, Filter, X, Share2, Star, Target, Image as ImageIcon, MoreVertical, Search, ChevronDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db, auth } from "@/firebase-config";
import { deleteBean, updateGeneralSettings } from "@/lib/firestore";
import { format, parseISO, differenceInDays } from "date-fns";
import type { SavedBean, GeneralSettings } from "@/lib/types";
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
import { buildBeanShareUrl, generateBeanShareImage, shareImageOrDownload } from "@/lib/share-card";

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

interface BeanLibraryProps {
  sharedBeans?: SavedBean[];
  sharedGeneralSettings?: GeneralSettings;
}

const sortBeansByRoasterAndName = (list: SavedBean[]) => {
  return [...list].sort((a, b) => {
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
};

export function BeanLibrary({ sharedBeans, sharedGeneralSettings }: BeanLibraryProps = {}) {
  const [beans, setBeans] = useState<SavedBean[]>([]);
  const [filteredBeans, setFilteredBeans] = useState<SavedBean[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [editingBean, setEditingBean] = useState<SavedBean | Partial<SavedBean> | null>(null);
  
  const [libraryTab, setLibraryTab] = useState<"library" | "discover">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRoasters, setExpandedRoasters] = useState<Record<string, boolean>>({});
  const [expandedBeans, setExpandedBeans] = useState<Record<string, boolean>>({});

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterRoastery, setFilterRoastery] = useState<string | null>(null);
  const [filterFlavorTags, setFilterFlavorTags] = useState<string[]>([]);
  const [filterRoastLevel, setFilterRoastLevel] = useState<[number, number]>([1, 5]);
  const [filterPricePerKilo, setFilterPricePerKilo] = useState<[number, number]>([0, 500]);
  
  const [activeBeanId, setActiveBeanId] = useState<string | null>(null);
  const [activeOpenedDate, setActiveOpenedDate] = useState<string>("");

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    filterRoastery !== null ||
    filterFlavorTags.length > 0 ||
    filterRoastLevel[0] !== 1 ||
    filterRoastLevel[1] !== 5 ||
    filterPricePerKilo[0] !== 0 ||
    filterPricePerKilo[1] !== 500;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterRoastery(null);
    setFilterFlavorTags([]);
    setFilterRoastLevel([1, 5]);
    setFilterPricePerKilo([0, 500]);
  };

  useEffect(() => {
    let newFilteredBeans = [...beans];

    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (normalizedSearch) {
      newFilteredBeans = newFilteredBeans.filter(
        (bean) =>
          bean.beanName?.toLowerCase().includes(normalizedSearch) ||
          bean.roasterName?.toLowerCase().includes(normalizedSearch)
      );
    }

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
  }, [beans, searchQuery, filterRoastery, filterFlavorTags, filterRoastLevel, filterPricePerKilo]);

  const toggleFlavorTagFilter = (tag: string) => {
    setFilterFlavorTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    if (sharedGeneralSettings !== undefined) {
      setActiveBeanId(sharedGeneralSettings.activeBeanId || null);
      setActiveOpenedDate(sharedGeneralSettings.activeBeanOpenedDate || "");
    }
  }, [sharedGeneralSettings]);

  useEffect(() => {
    if (sharedBeans !== undefined) {
      const sorted = sortBeansByRoasterAndName(sharedBeans);
      setBeans(sorted);
      setLoading(false);
    }
  }, [sharedBeans]);

  useEffect(() => {
    if (sharedBeans !== undefined && sharedGeneralSettings !== undefined) {
      return;
    }

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
      const beansFromDb = sortBeansByRoasterAndName(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedBean))
      );

      setBeans(beansFromDb);
      setFilteredBeans(beansFromDb); // Initially, filtered beans are all beans
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("BeanLibrary error:", error);
    });
    return () => {
       unsubscribe();
       unsubscribeUser();
    }
  }, [sharedBeans !== undefined, sharedGeneralSettings !== undefined]);

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
    const shareUrl = buildBeanShareUrl(bean);
    const shareText = `הנה הכיול שעבד לי ל-${bean.beanName} של ${bean.roasterName} ☕${bean.grindSetting ? `\nדרגת טחינה: ${bean.grindSetting}` : ''}${bean.flavorTags && bean.flavorTags.length > 0 ? `\nטעמים: ${bean.flavorTags.join(', ')}` : ''}\n\nלחץ להוסיף ישר לרשימה שלך:\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'המלצת קפה - Barista Mate',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("הטקסט והקישור הועתקו ללוח!");
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    } else {
      alert("השיתוף וההעתקה זמינים רק בחיבור מאובטח (HTTPS) או דרך הדפדפן שלך.");
    }
  };

  const handleShareCardImage = async (bean: SavedBean) => {
    try {
      const shareUrl = buildBeanShareUrl(bean);
      const file = await generateBeanShareImage(bean);
      const shareText = `המלצת קפה ב-Barista Mate ☕: ${bean.roasterName} - ${bean.beanName}\n${shareUrl}`;
      await shareImageOrDownload(file, shareText, 'המלצת קפה - Barista Mate', shareUrl);
    } catch (error) {
      console.error("Error sharing bean image:", error);
    }
  };

  const activeBean = beans.find(b => b.id === activeBeanId);
  const otherBeans = filteredBeans.filter(b => b.id !== activeBeanId);

  const uniqueRoasters = useMemo(() => {
    const set = new Set<string>();
    beans.forEach((b) => {
      if (b.id !== activeBeanId && b.roasterName) {
        set.add(b.roasterName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [beans, activeBeanId]);

  const toggleRoaster = (roasteryName: string) => {
    setExpandedRoasters((prev) => ({
      ...prev,
      [roasteryName]: !prev[roasteryName],
    }));
  };

  const toggleBeanDetails = (beanId: string) => {
    setExpandedBeans((prev) => ({
      ...prev,
      [beanId]: !prev[beanId],
    }));
  };

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

    const renderCompactBeanRow = (bean: SavedBean) => {
      const isDetailsOpen = !!expandedBeans[bean.id];

      return (
        <div key={bean.id} className="border-t border-[#3E2C22] pt-3 first:border-0 first:pt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {bean.imageUrl ? (
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-[#C67C4E]/20">
                  <img src={bean.imageUrl} alt={bean.beanName} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-[#C67C4E]/10 flex items-center justify-center flex-shrink-0 border border-[#C67C4E]/20">
                  <Coffee className="w-5 h-5 text-[#C67C4E]/50" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#E6D2B5] truncate text-base">{bean.beanName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {bean.grindSetting && (
                    <Badge
                      variant="secondary"
                      className="bg-[#C67C4E]/20 text-[#E6D2B5] border-[#C67C4E]/40 font-medium text-[11px] px-1.5 py-0"
                    >
                      טחינה: {bean.grindSetting}
                    </Badge>
                  )}
                  {bean.rating != null && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#E6D2B5]/80">
                      <Star className="h-3.5 w-3.5 fill-[#C67C4E] text-[#C67C4E]" />
                      {bean.rating.toFixed(1)}
                    </span>
                  )}
                  {bean.pricePerKilo && (
                    <span className="text-xs text-[#EAE0D5]/60">
                      {bean.pricePerKilo.toFixed(0)}₪/ק"ג
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[#C67C4E] border-[#C67C4E]/30 hover:bg-[#C67C4E]/10 text-xs shadow-none"
                onClick={() => handleSetActive(bean.id)}
              >
                הגדר כפעיל
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#EAE0D5]/70 hover:text-[#E6D2B5]"
                onClick={() => toggleBeanDetails(bean.id)}
                aria-label={isDetailsOpen ? "הסתר פרטים" : "הצג פרטים"}
                title={isDetailsOpen ? "הסתר פרטים" : "הצג פרטים"}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#EAE0D5]/60 hover:text-[#EAE0D5]"
                    aria-label="אפשרויות נוספות"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
                  <DropdownMenuItem
                    onClick={() => handleShareCardImage(bean)}
                    aria-label="שתף כתמונה"
                    className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]"
                  >
                    <ImageIcon className="h-4 w-4 ml-2" />
                    <span>שתף כתמונה</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleShare(bean)}
                    aria-label="שתף"
                    className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]"
                  >
                    <Share2 className="h-4 w-4 ml-2" />
                    <span>שתף מתכון</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleEdit(bean)}
                    aria-label="ערוך"
                    className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]"
                  >
                    <Pencil className="h-4 w-4 ml-2" />
                    <span>ערוך</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(bean.id)}
                    aria-label="מחק"
                    className="cursor-pointer text-red-400 focus:bg-[#3E2C22] focus:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    <span>מחק</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isDetailsOpen && (
            <div className="mt-3 pt-3 border-t border-[#3E2C22]/50 space-y-2.5 text-sm">
              {bean.roastLevel && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#EAE0D5]/80">קלייה:</span>
                  <RoastRatingInput rating={bean.roastLevel} onRatingChange={() => {}} disabled size="sm" />
                </div>
              )}
              {bean.beanDescription && (
                <p className="text-xs text-[#EAE0D5]/85 whitespace-pre-line">{bean.beanDescription}</p>
              )}
              {bean.flavorTags && bean.flavorTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {bean.flavorTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#C67C4E]/40 bg-[#C67C4E]/10 px-2 py-0.5 text-[11px] text-[#E6D2B5]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        {sortedGroups.map(([roasteryName, beansInGroup]) => {
          const isOpen = hasActiveFilter ? true : !!expandedRoasters[roasteryName];
          const countLabel = beansInGroup.length === 1 ? "פול 1" : `${beansInGroup.length} פולים`;

          return (
            <Card key={roasteryName} className="transition-colors hover:border-[#C67C4E]/30 overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => toggleRoaster(roasteryName)}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-[#C67C4E]/5 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="font-semibold text-base text-[#E6D2B5] truncate"
                        data-testid="roastery-title"
                      >
                        {roasteryName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-[#3E2C22]/70 text-[#E6D2B5]/90 border-[#3E2C22] text-xs font-normal shrink-0"
                      >
                        {countLabel}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#C67C4E] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-2 pb-4 px-4 space-y-3 border-t border-[#3E2C22]/60">
                    {beansInGroup.map((bean) => renderCompactBeanRow(bean))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeBean && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[#C67C4E] flex items-center gap-2">
            <Target className="h-6 w-6" /> הפול הפעיל שלך
          </h2>
          <Card className="border-[#C67C4E] shadow-[0_0_15px_rgba(198,124,78,0.15)] flex flex-col bg-[#C67C4E]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#E6D2B5]">{activeBean.roasterName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              {(() => {
                const bean = activeBean;
                const imageContainerClass = "w-20 h-20 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 border-2 border-[#C67C4E]/30 shadow-lg";
                const placeholderClass = "w-20 h-20 sm:w-28 sm:h-28 rounded-lg bg-[#C67C4E]/10 flex items-center justify-center flex-shrink-0 border-2 border-[#C67C4E]/30 shadow-inner";
                return (
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {bean.imageUrl ? (
                            <div className={imageContainerClass}>
                              <img src={bean.imageUrl} alt={bean.beanName} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ) : (
                            <div className={placeholderClass}>
                              <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-[#C67C4E]/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-semibold text-[#E6D2B5] truncate max-w-full text-lg sm:text-2xl">{bean.beanName}</p>
                              <Badge
                                className="bg-[#C67C4E] hover:bg-red-500 text-white select-none whitespace-nowrap cursor-pointer transition-colors text-xs shrink-0"
                                onClick={() => handleSetActive(null)}
                                title="לחץ כדי להסיר פול פעיל"
                              >
                                <Target className="h-3 w-3 mr-1" /> פעיל כרגע
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center gap-2">
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
                          {bean.roastDate && (() => {
                            try {
                              const daysSinceRoast = differenceInDays(new Date(), parseISO(bean.roastDate));
                              if (Number.isNaN(daysSinceRoast) || daysSinceRoast < 0) return null;
                              if (daysSinceRoast <= 3) {
                                return (
                                  <Badge variant="outline" className="border-amber-500/40 bg-amber-950/30 text-amber-300 text-xs">
                                    טרי מדי ({daysSinceRoast} ימים מהקלייה · מומלץ להמתין לדה-גז)
                                  </Badge>
                                );
                              }
                              if (daysSinceRoast <= 30) {
                                return (
                                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs">
                                    בחלון טריות אידיאלי ✨ ({daysSinceRoast} ימים מהקלייה)
                                  </Badge>
                                );
                              }
                              return (
                                <Badge variant="outline" className="border-[#C67C4E]/40 bg-[#1F1712] text-[#EAE0D5]/80 text-xs">
                                  {daysSinceRoast} ימים מהקלייה
                                </Badge>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                        </div>

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

                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[#EAE0D5]/70 hover:text-[#C67C4E]"
                          onClick={() => handleShareCardImage(bean)}
                          aria-label="שתף כתמונה"
                          title="שתף כתמונה"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[#EAE0D5]/70 hover:text-[#C67C4E]"
                          onClick={() => handleShare(bean)}
                          aria-label="שתף"
                          title="שתף מתכון"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-[#EAE0D5]/60 hover:text-[#EAE0D5]"
                              aria-label="אפשרויות נוספות"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
                            <DropdownMenuItem
                              onClick={() => handleEdit(bean)}
                              aria-label="ערוך"
                              className="cursor-pointer focus:bg-[#3E2C22] focus:text-[#EAE0D5]"
                            >
                              <Pencil className="h-4 w-4 ml-2" />
                              <span>ערוך</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(bean.id)}
                              aria-label="מחק"
                              className="cursor-pointer text-red-400 focus:bg-[#3E2C22] focus:text-red-300"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              <span>מחק</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {bean.beanDescription && (
                      <p className="text-sm text-[#EAE0D5]/90 whitespace-pre-line mt-3">{bean.beanDescription}</p>
                    )}

                    {bean.rating != null && (
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
                            );
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

                    {bean.flavorTags && bean.flavorTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-[#3E2C22]/30">
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
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={libraryTab} onValueChange={(v) => setLibraryTab(v as "library" | "discover")} className="w-full" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-2">
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span>הספרייה שלי ({beans.length})</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>גילוי והמלצות</span>
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setAddBeanOpen(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף פול
          </Button>
        </div>

        <TabsContent value="library" className="mt-0">
          <div className="flex flex-col md:flex-row gap-6">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full md:max-w-xs">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#EAE0D5]/50 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חפש פול או בית קלייה..."
                    aria-label="חפש פול או בית קלייה"
                    className="pr-9 pl-8 bg-[#1F1712] border-[#3E2C22] text-[#E6D2B5] placeholder:text-[#EAE0D5]/40"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="נקה חיפוש"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#EAE0D5]/50 hover:text-[#E6D2B5]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0">
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

            <div className="flex-grow space-y-4 min-w-0">
              {uniqueRoasters.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="region" aria-label="סינון מהיר לפי בית קלייה">
                  <button
                    type="button"
                    onClick={() => setFilterRoastery(null)}
                    className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors border ${
                      filterRoastery === null
                        ? "bg-[#C67C4E] text-white border-[#C67C4E]"
                        : "bg-[#1F1712] text-[#EAE0D5]/80 border-[#3E2C22] hover:border-[#C67C4E]/50"
                    }`}
                  >
                    הכל
                  </button>
                  {uniqueRoasters.map((roaster) => (
                    <button
                      key={roaster}
                      type="button"
                      onClick={() => setFilterRoastery(filterRoastery === roaster ? null : roaster)}
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors border ${
                        filterRoastery === roaster
                          ? "bg-[#C67C4E] text-white border-[#C67C4E]"
                          : "bg-[#1F1712] text-[#EAE0D5]/80 border-[#3E2C22] hover:border-[#C67C4E]/50"
                      }`}
                    >
                      {roaster}
                    </button>
                  ))}
                </div>
              )}

              {renderContent()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-0 space-y-4">
          <BeanSuggestions
            userBeans={beans}
            onSelectBean={(suggested) => {
              setEditingBean(suggested);
              setAddBeanOpen(true);
            }}
          />
          <CommunitySpotlight
            onSelectBean={(suggested) => {
              setEditingBean(suggested);
              setAddBeanOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

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

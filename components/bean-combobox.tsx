"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, BadgeCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getGlobalBeans } from "@/lib/firestore";

interface BeanComboboxProps {
    roasterName?: string;
    value: string;
    onChange: (value: string, beanData?: { roastLevel?: number, flavorTags?: string[] }) => void;
    "aria-labelledby"?: string;
}

export function BeanCombobox({ roasterName, value, onChange, "aria-labelledby": ariaLabelledBy }: BeanComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [globalBeans, setGlobalBeans] = React.useState<{id: string, roasterName: string, beanName: string, roastLevel?: number, flavorTags?: string[]}[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    async function fetchBeans() {
      if (roasterName) {
        setIsLoading(true);
        try {
          const beans = await getGlobalBeans(roasterName);
          setGlobalBeans(beans);
        } catch (error) {
          console.error("Failed to fetch beans:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setGlobalBeans([]);
      }
    }
    fetchBeans();
  }, [roasterName]);

  const uniqueBeans = React.useMemo(() => {
    const names = globalBeans.map(b => b.beanName);
    return Array.from(new Set(names)).sort((a,b) => a.localeCompare(b));
  }, [globalBeans]);

  const handleAddNew = () => {
    if (searchQuery) {
        onChange(searchQuery);
        setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={!roasterName}
          aria-expanded={open}
          aria-labelledby={ariaLabelledBy}
          className="w-full justify-between font-normal"
        >
          {value ? value : (roasterName ? "בחר או הקלד שם פול..." : "בחר בית קלייה קודם")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" portalled={false}>
        <Command>
          <CommandInput 
              placeholder="חיפוש פול ממסד הנתונים..." 
              value={searchQuery} 
              onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {!isLoading && (
                <div className="py-4 text-center text-sm">
                    {searchQuery ? (
                        <div className="space-y-3">
                           <p className="text-muted-foreground">לא נמצא במאגר המאומת.</p>
                           <Button variant="secondary" className="w-[90%] mx-auto" onClick={handleAddNew}>
                               השתמש ב-"{searchQuery}"
                           </Button>
                        </div>
                    ) : (
                       "הקלד שם פול לחיפוש..."
                    )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {searchQuery && !uniqueBeans.includes(searchQuery) && (
                  <CommandItem
                      onSelect={handleAddNew}
                      value={`add_new_${searchQuery}`}
                      className="text-[#C67C4E] font-medium"
                  >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      הוסף פול שאינו ברשימה: "{searchQuery}"
                  </CommandItem>
              )}
              {searchQuery && !uniqueBeans.includes(searchQuery) && <CommandSeparator className="my-1" />}
              {isLoading && <CommandItem disabled>טוען מאגר לאומי...</CommandItem>}
              {!isLoading && uniqueBeans.map((bean) => (
                  <CommandItem
                      key={bean}
                      value={bean}
                      onSelect={(currentValue) => {
                          if (currentValue === value) {
                             onChange("")
                          } else {
                             const beanObject = globalBeans.find(b => b.beanName === bean);
                             onChange(bean, beanObject ? { roastLevel: beanObject.roastLevel, flavorTags: beanObject.flavorTags } : undefined);
                          }
                          setOpen(false)
                      }}
                  >
                      <Check
                          className={cn(
                              "ml-2 h-4 w-4",
                              value === bean ? "opacity-100" : "opacity-0"
                          )}
                      />
                      <span className="flex-grow flex items-center gap-1.5">
                          {bean}
                          <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      </span>
                  </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

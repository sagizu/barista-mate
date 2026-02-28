
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import roasteries from '@/roasteries.json';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPrivateRoasters, addPrivateRoaster, deletePrivateRoaster } from "@/lib/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase-config';

interface RoasterComboboxProps {
    value: string;
    onChange: (value: string) => void;
    "aria-labelledby"?: string;
}

function AddRoasterDialog({ open, onOpenChange, onRoasterAdded, initialValue = "" }: { open: boolean, onOpenChange: (open: boolean) => void, onRoasterAdded: (roasterName: string) => void, initialValue?: string }) {
    const [roasterName, setRoasterName] = React.useState(initialValue);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setRoasterName(initialValue);
            setError(null);
        }
    }, [open, initialValue]);

    const handleSave = async () => {
        if (!roasterName.trim()) {
            setError("שם בית הקלייה הוא שדה חובה.");
            return;
        }
        try {
            await addPrivateRoaster(roasterName);
            onRoasterAdded(roasterName);
            setRoasterName("");
            onOpenChange(false);
        } catch (err) {
            console.error("Error adding roaster: ", err);
            setError("שגיאה בהוספת בית הקלייה. נסה שוב.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
                <DialogHeader>
                    <DialogTitle>הוסף בית קלייה חדש</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roaster-name" className="text-right">
                            שם
                        </Label>
                        <Input
                            id="roaster-name"
                            value={roasterName}
                            onChange={(e) => setRoasterName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-red-500 text-right">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button onClick={handleSave}>שמור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteRoasterDialog({ open, onOpenChange, roasterName, onRoasterDeleted }: { open: boolean, onOpenChange: (open: boolean) => void, roasterName: string, onRoasterDeleted: (roasterName: string) => void }) {
    const [error, setError] = React.useState<string | null>(null);

    const handleDelete = async () => {
        try {
            await deletePrivateRoaster(roasterName);
            onRoasterDeleted(roasterName);
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error deleting roaster: ", err);
            setError(err.message || "שגיאה במחיקת בית הקלייה. נסה שוב.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
                <DialogHeader>
                    <DialogTitle>מחק את "{roasterName}"?</DialogTitle>
                    <DialogDescription>
                        פעולה זו תמחק את בית הקלייה לצמיתות. לא ניתן לשחזר פעולה זו.
                    </DialogDescription>
                </DialogHeader>
                {error && <p className="text-sm text-red-500 text-right py-2">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button variant="destructive" onClick={handleDelete}>מחק</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function RoasterCombobox({ value, onChange, "aria-labelledby": ariaLabelledBy }: RoasterComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [user] = useAuthState(auth);
  const [privateRoasters, setPrivateRoasters] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddRoasterOpen, setAddRoasterOpen] = React.useState(false);
  const [isDeleteRoasterOpen, setDeleteRoasterOpen] = React.useState(false);
  const [roasterToDelete, setRoasterToDelete] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [addRoasterInitialValue, setAddRoasterInitialValue] = React.useState("");


  React.useEffect(() => {
    async function fetchPrivateRoasters() {
      if (user) {
        setIsLoading(true);
        try {
          const roasters = await getPrivateRoasters();
          setPrivateRoasters(roasters);
        } catch (error) {
          console.error("Failed to fetch private roasters:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    fetchPrivateRoasters();
  // CRITICAL: Always use user?.uid here. Using the full 'user' object 
  // causes infinite render loops in Vitest due to reference changes.
  }, [user?.uid]);

  const roastersList = React.useMemo(() => {
    const combined = [...roasteries, ...privateRoasters];
    const unique = Array.from(new Set(combined));
    return unique.sort((a,b) => a.localeCompare(b)).map(roastery => ({ label: roastery, value: roastery }));
  }, [privateRoasters]);

  const handleRoasterAdded = (roasterName: string) => {
    setPrivateRoasters(prev => [...prev, roasterName]);
    onChange(roasterName); // Select the newly added roaster
    setAddRoasterOpen(false);
    setOpen(false);
  }

  const handleRoasterDeleted = (roasterName: string) => {
    setPrivateRoasters(prev => prev.filter(r => r !== roasterName));
    if (value === roasterName) {
        onChange(""); // Clear selection if the deleted roaster was selected
    }
    setDeleteRoasterOpen(false);
  }

  const openDeleteDialog = (roasterName: string) => {
    setRoasterToDelete(roasterName);
    setDeleteRoasterOpen(true);
    setOpen(false); // Close the combobox popover
  }
  
  const openAddDialog = (initialValue = "") => {
    setAddRoasterInitialValue(initialValue);
    setAddRoasterOpen(true);
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={ariaLabelledBy}
            className="w-full justify-between"
          >
            {value
              ? roastersList.find((roaster) => roaster.value === value)?.label
              : "בחר בית קלייה..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" portalled={false}>
          <Command>
            <CommandInput 
                placeholder="חיפוש בית קלייה..." 
                value={searchQuery} 
                onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {!isLoading && (
                  <div className="py-4 text-center text-sm">
                      לא נמצא בית קלייה.
                      {searchQuery && (
                          <Button variant="link" className="p-0 h-auto" onClick={() => openAddDialog(searchQuery)}>
                              הוסף את "{searchQuery}"...
                          </Button>
                      )}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                    onSelect={() => openAddDialog()}
                    value="add-new-roaster"
                    className="text-primary"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    הוסף בית קלייה חדש
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {isLoading && <CommandItem disabled>טוען בתי קלייה...</CommandItem>}
                {!isLoading && roastersList.map((roaster) => {
                    const isPrivate = !roasteries.includes(roaster.value);
                    return (
                        <CommandItem
                            key={roaster.value}
                            value={roaster.value}
                            onSelect={(currentValue) => {
                                onChange(currentValue === value ? "" : currentValue)
                                setOpen(false)
                            }}
                        >
                            <Check
                                className={cn(
                                    "ml-2 h-4 w-4",
                                    value === roaster.value ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <span className="flex-grow">{roaster.label}</span>
                            {isPrivate && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openDeleteDialog(roaster.value)}}>
                                    <Trash2 className="h-4 w-4 text-red-500/80" />
                                </Button>
                            )}
                        </CommandItem>
                    )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddRoasterDialog 
        open={isAddRoasterOpen}
        onOpenChange={setAddRoasterOpen}
        onRoasterAdded={handleRoasterAdded}
        initialValue={addRoasterInitialValue}
      />
      <DeleteRoasterDialog
        open={isDeleteRoasterOpen}
        onOpenChange={setDeleteRoasterOpen}
        roasterName={roasterToDelete}
        onRoasterDeleted={handleRoasterDeleted}
       />
    </>
  )
}

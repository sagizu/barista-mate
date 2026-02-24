
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface RoasterComboboxProps {
    value: string;
    onChange: (value: string) => void;
    "aria-labelledby"?: string;
}

export function RoasterCombobox({ value, onChange, "aria-labelledby": ariaLabelledBy }: RoasterComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const roastersList = roasteries.map(roastery => ({ label: roastery, value: roastery }));

  return (
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
          <CommandInput placeholder="חיפוש בית קלייה..." />
          <CommandEmpty>לא נמצא בית קלייה.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {roastersList.map((roaster) => (
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
                      "mr-2 h-4 w-4",
                      value === roaster.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {roaster.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select"; // Simplified import
import { DrinkRecipe, DrinkType, MilkType } from "../lib/types";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";

interface PeopleRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: DrinkRecipe;
  onSave: (recipe: DrinkRecipe) => void;
  onDelete: (recipeId: string) => void;
}

const DRINK_TYPES: DrinkType[] = ["Espresso", "Americano", "Latte", "Cappuccino"];
const MILK_TYPES: MilkType[] = ["None", "Whole", "Skim", "Oat", "Soy", "Almond"];

export const PeopleRecipeDialog = ({
  open,
  onOpenChange,
  recipe,
  onSave,
  onDelete,
}: PeopleRecipeDialogProps) => {
  const [editedRecipe, setEditedRecipe] = useState<DrinkRecipe>(recipe);

  useEffect(() => {
    setEditedRecipe(recipe);
  }, [recipe]);

  const handleSave = () => {
    onSave(editedRecipe);
  };

  const handleDelete = () => {
    onDelete(editedRecipe.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ערוך מתכון</DialogTitle>
          <DialogDescription>
            עדכן את פרטי המשקה של המתכון.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="drinkType" className="text-right">
              סוג משקה
            </Label>
            {/* Using the simplified Select component */}
            <Select
              id="drinkType"
              className="col-span-3"
              value={editedRecipe.drinkType}
              onChange={(e) =>
                setEditedRecipe({ ...editedRecipe, drinkType: e.target.value as DrinkType })
              }
            >
              {DRINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="milkType" className="text-right">
              סוג חלב
            </Label>
            <Select
              id="milkType"
              className="col-span-3"
              value={editedRecipe.milkType}
              onChange={(e) =>
                setEditedRecipe({ ...editedRecipe, milkType: e.target.value as MilkType })
              }
            >
              {MILK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="milkAmount" className="text-right">
              כמות חלב (מ"ל)
            </Label>
            <Input
              id="milkAmount"
              type="number"
              value={editedRecipe.milkAmountMl}
              onChange={(e) =>
                setEditedRecipe({
                  ...editedRecipe,
                  milkAmountMl: parseInt(e.target.value, 10) || 0,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="extraNotes" className="text-right">
              הערות
            </Label>
            <Textarea
              id="extraNotes"
              value={editedRecipe.extraNotes}
              onChange={(e) =>
                setEditedRecipe({ ...editedRecipe, extraNotes: e.target.value })
              }
              className="col-span-3"
              placeholder="לדוגמה: חזק במיוחד, כפית סוכר"
            />
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDelete}>
                מחק
            </Button>
            <Button onClick={handleSave}>שמור שינויים</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

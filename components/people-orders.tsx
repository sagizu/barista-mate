
"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Coffee, Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  getStoredPeople,
  setStoredPeople,
} from "@/lib/storage";
import type { Person, DrinkRecipe } from "@/lib/types";
import { DRINK_TYPES, MILK_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

function newPerson(name: string): Person {
  return {
    id: crypto.randomUUID(),
    name,
    recipes: [],
  };
}

function newRecipe(): DrinkRecipe {
  return {
    id: crypto.randomUUID(),
    drinkType: "אספרסו",
    milkType: "ללא",
    milkAmountMl: 0,
    sugarSyrup: "",
    ice: "",
    notes: "",
  };
}

export function PeopleOrders() {
  const [people, setPeople] = useState<Person[]>([]);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<DrinkRecipe | null>(null);

  useEffect(() => {
    setPeople(getStoredPeople());
  }, []);

  const persist = useCallback((next: Person[]) => {
    setPeople(next);
    setStoredPeople(next);
  }, []);

  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name) return;
    const next = [...people, newPerson(name)];
    persist(next);
    setNewPersonName("");
    setAddPersonOpen(false);
  };

  const removePerson = (id: string) => {
    persist(people.filter((p) => p.id !== id));
  };

  const addRecipe = (personId: string) => {
    setEditingPersonId(personId);
    setEditingRecipe(newRecipe());
    setRecipeDialogOpen(true);
  };

  const editRecipe = (personId: string, recipe: DrinkRecipe) => {
    setEditingPersonId(personId);
    setEditingRecipe({ ...recipe });
    setRecipeDialogOpen(true);
  };

  const saveRecipe = () => {
    if (!editingPersonId || !editingRecipe) return;
    const next = people.map((p) => {
      if (p.id !== editingPersonId) return p;
      const existing = p.recipes.find((r) => r.id === editingRecipe.id);
      const recipes = existing
        ? p.recipes.map((r) => (r.id === editingRecipe.id ? editingRecipe : r))
        : [...p.recipes, editingRecipe];
      return { ...p, recipes };
    });
    persist(next);
    setRecipeDialogOpen(false);
    setEditingPersonId(null);
    setEditingRecipe(null);
  };

  const deleteRecipe = (personId: string, recipeId: string) => {
    const next = people.map((p) => {
      if (p.id !== personId) return p;
      return { ...p, recipes: p.recipes.filter((r) => r.id !== recipeId) };
    });
    persist(next);
    setRecipeDialogOpen(false);
    setEditingPersonId(null);
    setEditingRecipe(null);
  };

  const person = editingPersonId ? people.find((p) => p.id === editingPersonId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#E6D2B5] flex items-center gap-2">
            <Coffee className="h-5 w-5 text-[#C67C4E]" />
            אנשים והזמנות
          </h2>
          <p className="text-sm text-[#EAE0D5]/90 mt-1">
            הוסף אנשים והגדר מתכוני משקה לכל אחד
          </p>
        </div>
        <Button onClick={() => setAddPersonOpen(true)} className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90">
          <UserPlus className="h-4 w-4 ml-2" />
          הוסף אדם
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => addRecipe(p.id)}
                  aria-label="הוסף מתכון"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-300 hover:text-red-200"
                  onClick={() => removePerson(p.id)}
                  aria-label="מחק"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {p.recipes.length === 0 ? (
                <p className="text-sm text-[#EAE0D5]/70">אין מתכונים. הוסף משקה.</p>
              ) : (
                <ul className="space-y-3">
                  {p.recipes.map((rec) => (
                    <li key={rec.id}>
                      <button
                        type="button"
                        onClick={() => editRecipe(p.id, rec)}
                        className={cn(
                          "w-full text-right rounded-xl border border-stone-800 bg-black/20 p-3",
                          "hover:border-[#C67C4E]/40 hover:bg-black/30 transition-colors",
                          "flex flex-col gap-3"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-[#C67C4E] flex-1 min-w-0">
                            {rec.drinkType}
                          </h4>
                          <span className="shrink-0" aria-hidden>
                            <Pencil className="h-4 w-4 text-[#EAE0D5]/60" />
                          </span>
                        </div>
                        <ul className="space-y-0.5 text-sm text-[#EAE0D5]/90">
                          {rec.milkType !== "ללא" && (
                            <li className="flex items-center gap-1.5 justify-end">
                              <span>🥛</span>
                              <span>
                                חלב {rec.milkType}
                                {rec.milkAmountMl > 0 && ` (${rec.milkAmountMl}מ"ל)`}
                              </span>
                            </li>
                          )}
                          {rec.ice?.trim() && rec.ice.trim() !== "ללא" && (
                            <li className="flex items-center gap-1.5 justify-end">
                              <span>🧊</span>
                              <span>קרח: {rec.ice.trim()} קוביות</span>
                            </li>
                          )}
                          {rec.sugarSyrup?.trim() && (
                            <li className="flex items-center gap-1.5 justify-end">
                              <span>🍯</span>
                              <span>{rec.sugarSyrup.trim()}</span>
                            </li>
                          )}
                          {rec.notes?.trim() && (
                            <li className="flex items-center gap-1.5 justify-end">
                              <span>📝</span>
                              <span>{rec.notes.trim()}</span>
                            </li>
                          )}
                        </ul>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Person Dialog */}
      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
          <DialogHeader>
            <DialogTitle>הוסף אדם</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="person-name">שם</Label>
            <Input
              id="person-name"
              placeholder="למשל: אני, בת/בן זוג, אורחים"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>
              ביטול
            </Button>
            <Button onClick={addPerson} disabled={!newPersonName.trim()}>
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="bg-[#1F1712] border-[#3E2C22]">
          <DialogHeader>
            <DialogTitle>
              {editingRecipe?.id && person?.recipes.some((r) => r.id === editingRecipe.id)
                ? "ערוך מתכון"
                : "מתכון חדש"}
              {person && (
                <Badge variant="secondary" className="mr-2">
                  {person.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {editingRecipe && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>סוג משקה</Label>
                <Select
                  value={editingRecipe.drinkType}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      drinkType: e.target.value as DrinkRecipe["drinkType"],
                    })
                  }
                >
                  {DRINK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>סוג חלב</Label>
                <Select
                  value={editingRecipe.milkType}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      milkType: e.target.value as DrinkRecipe["milkType"],
                    })
                  }
                >
                  {MILK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>כמות חלב (מ"ל)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRecipe.milkAmountMl || ""}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      milkAmountMl: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>סוכר/סירופ (כמות וסוג)</Label>
                <Input
                  value={editingRecipe.sugarSyrup}
                  onChange={(e) =>
                    setEditingRecipe({ ...editingRecipe, sugarSyrup: e.target.value })
                  }
                  placeholder="למשל: כפית סוכר, סירופ וניל"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipe-ice">כמות קרח (קוביות)</Label>
                <Input
                  id="recipe-ice"
                  type="text"
                  value={editingRecipe.ice}
                  onChange={(e) =>
                    setEditingRecipe({ ...editingRecipe, ice: e.target.value })
                  }
                  placeholder="למשל: 6-8"
                />
              </div>
              <div className="grid gap-2">
                <Label>הערות</Label>
                <Input
                  value={editingRecipe.notes}
                  onChange={(e) =>
                    setEditingRecipe({ ...editingRecipe, notes: e.target.value })
                  }
                  placeholder="הערות נוספות"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {editingRecipe &&
              editingPersonId &&
              person?.recipes.some((r) => r.id === editingRecipe.id) && (
                <Button
                  variant="destructive"
                  className="mr-auto"
                  onClick={() =>
                    deleteRecipe(editingPersonId, editingRecipe.id)
                  }
                >
                  מחק מתכון
                </Button>
              )}
            <Button variant="outline" onClick={() => setRecipeDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={saveRecipe}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

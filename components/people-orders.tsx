import {
  Card,  CardContent,  CardDescription,  CardFooter,  CardHeader,  CardTitle,} from "./ui/card";
import { DrinkRecipe, Person } from "../lib/types";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { newPerson, newRecipe } from "../lib/factory";
import { PlusCircle, Trash2 } from "lucide-react";
import { PeopleRecipeDialog } from "./people-recipe-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";

const LOCAL_STORAGE_KEY = "barista_mate_people";

// TODO: Add a way to reorder people
// TODO: Add a way to order drinks for a person

const persist = (people: Person[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(people));
};

export const PeopleOrders = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<DrinkRecipe | null>(null);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setPeople(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse people from local storage", e);
      }
    }
  }, []);

  useEffect(() => {
    // This is a bit of a hack to persist the people state
    // whenever it changes. A better solution would be to use a state
    // management library like Redux or Zustand.
    const handler = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        setPeople(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
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

      const saveRecipe = (recipe: DrinkRecipe) => {
        if (!editingPersonId) return;
        const person = people.find((p) => p.id === editingPersonId);
        if (!person) return;

        const isNew = !person.recipes.some(r => r.id === recipe.id);

        const updatedRecipes = isNew
          ? [...person.recipes, recipe]
          : person.recipes.map((r) => (r.id === recipe.id ? recipe : r));

        const next = people.map((p) =>
          p.id === editingPersonId ? { ...p, recipes: updatedRecipes } : p
        );
        persist(next);
        setRecipeDialogOpen(false);
      };

      const deleteRecipe = (recipeId: string) => {
        if (!editingPersonId) return;
        const person = people.find((p) => p.id === editingPersonId);
        if (!person) return;

        const next = people.map((p) =>
          p.id === editingPersonId
            ? { ...p, recipes: p.recipes.filter((r) => r.id !== recipeId) }
            : p
        );
        persist(next);
        setRecipeDialogOpen(false);
      }


  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-[#E6D2B5]">הזמנות קבועות</h2>
      <div className="grid gap-6">
        {people.map((person) => (
          <Card key={person.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{person.name}</span>
                <Button variant="ghost" size="icon" onClick={() => removePerson(person.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {person.recipes.length === 0 ? (
                <p className="text-sm text-gray-500">אין מתכונים שמורים לאדם זה.</p>
              ) : (
                <ul className="space-y-2">
                  {person.recipes.map((recipe) => (
                     <li key={recipe.id} 
                         className="text-sm p-2 rounded-md bg-stone-900/50 cursor-pointer hover:bg-stone-900"
                         onClick={() => editRecipe(person.id, recipe)} >
                     {recipe.drinkType} - {recipe.milkType}, {recipe.milkAmountMl}ml
                   </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => addRecipe(person.id)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                הוסף מתכון
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogTrigger asChild>
          <Button className="mt-6 w-full">הוסף אדם</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת אדם חדש</DialogTitle>
            <DialogDescription>
                הזן את שם האדם שברצונך להוסיף לרשימת ההזמנות.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input 
                value={newPersonName} 
                onChange={e => setNewPersonName(e.target.value)} 
                placeholder="לדוגמה: שרה" 
                onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                />
          </div>
          <DialogFooter>
            <Button onClick={addPerson}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {editingRecipe && (
        <PeopleRecipeDialog
          open={recipeDialogOpen}
          onOpenChange={setRecipeDialogOpen}
          recipe={editingRecipe}
          onSave={saveRecipe}
          onDelete={deleteRecipe}
        />
      )}
    </div>
  );
};
// Trigger rebuild

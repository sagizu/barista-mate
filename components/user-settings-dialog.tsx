'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  
import { updateProfile } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { deleteUserData } from '@/lib/user-service';

interface UserSettingsDialogProps {
  children: React.ReactNode;
}

const UserSettingsDialog = ({ children }: UserSettingsDialogProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!user || user.isAnonymous) return;
    setError('');
    setIsSaving(true);
    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName });
        }
        const userDocRef = doc(db, 'users', user.uid);
        await writeBatch(db).update(userDocRef, { displayName }).commit();
    } catch (err) {
      setError('Failed to update display name.');
      console.error(err);
    } finally {
        setIsSaving(false);
        setOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || user.isAnonymous) return;
    setIsDeleting(true);
    setError('');
    try {
        // Delete all data in firestore
        await deleteUserData(user.uid);

        // Delete user from auth
        await user.delete();
    } catch (error) {
        setError("Failed to delete account. Please try again.");
        console.error("Error deleting account:", error);
        setIsDeleting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
        <DialogHeader>
          <DialogTitle>הגדרות חשבון</DialogTitle>
        </DialogHeader>
        {user?.isAnonymous ? (
          <DialogDescription className="text-[#EAE0D5]/90">
            אתה מחובר כאורח. כדי לשמור את הנתונים שלך, עליך להירשם.
          </DialogDescription>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-[#EAE0D5]">
                שם
              </Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="col-span-3"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center col-span-4">{error}</p>}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full mt-4">מחיקת חשבון</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
                    <AlertDialogHeader>
                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                    <AlertDialogDescription>
                        פעולה זו תמחק את חשבונך ואת כל הנתונים המשויכים אליו לצמיתות. לא ניתן יהיה לשחזר את הנתונים.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                        {isDeleting ? 'מוחק...' : 'מחק חשבון'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <DialogFooter>
            {!user?.isAnonymous && <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'שומר...' : 'שמור שינויים'}</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsDialog;

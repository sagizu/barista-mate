'use client';

import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  AuthProvider
} from 'firebase/auth';
import { auth } from '../firebase-config';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignIn) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (isSignIn) {
        setError("ההתחברות נכשלה. בדוק את פרטיך ונסה שוב.");
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError("אימייל זה כבר נמצא בשימוש.");
        } else if (err.code === 'auth/weak-password') {
          setError("הסיסמה צריכה להכיל לפחות 6 תווים.");
        } else {
          setError("ההרשמה נכשלה. אנא נסה שוב.");
        }
      }
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
          setError("חשבון כבר קיים עם אמצעי אימות אחר.");
          return;
      }
      
      setError(`התחברות עם Google נכשלה. נסה שוב.`);
      console.error("Social sign-in error:", err);
    }
  };

  return (
    <Card className="w-[350px] bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
      <CardHeader>
        <CardTitle>{isSignIn ? 'התחברות' : 'הרשמה'}</CardTitle>
        <CardDescription>
          {isSignIn ? 'הזן את פרטי המשתמש שלך כדי להמשיך' : 'צור משתמש חדש כדי להתחיל'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
            <form onSubmit={handleEmailSubmit} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">סיסמה</Label>
                    <Input 
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full">{isSignIn ? 'התחבר' : 'הרשם'}</Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#3E2C22]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1F1712] px-2 text-muted-foreground">
                    או המשך עם
                    </span>
                </div>
            </div>
            
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full">
                Google
            </Button>
        </div>

        <div className="mt-4 text-center text-sm">
          {isSignIn ? "אין לך חשבון? " : "יש לך כבר חשבון? "}
          <button 
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError('');
            }}
            className="underline text-[#C67C4E] hover:text-[#E6D2B5]"
          >
            {isSignIn ? 'הירשם' : 'התחבר'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Auth;
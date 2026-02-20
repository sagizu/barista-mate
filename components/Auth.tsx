'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Card className="w-[350px] bg-[#1F1712] border-[#3E2C22] text-[#EAE0D5]">
      <CardHeader>
        <CardTitle>{isSignIn ? 'התחברות' : 'הרשמה'}</CardTitle>
        <CardDescription>
          {isSignIn ? 'הזן את פרטי המשתמש שלך כדי להמשיך' : 'צור משתמש חדש כדי להתחיל להשתמש באפליקציה'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
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
            <div className="flex flex-col space-y-1.5">
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
            <Button type="submit" className="w-full">{isSignIn ? 'התחבר' : 'הרשם'}</Button>
            {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
          </div>
        </form>
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
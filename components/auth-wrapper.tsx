'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase-config';
import Auth from './auth';
import { AuthSplashScreen } from './auth-splash-screen';
import { AuthContext } from '@/lib/auth-context';

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <AuthSplashScreen />;
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0f0a08]">
            <p className="text-lg text-red-500">אירעה שגיאה: {error.message}</p>
        </div>
    );
  }

  if (user) {
    return (
      <AuthContext.Provider value={{ user }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08] flex items-center justify-center p-4">
      <Auth />
    </div>
  );
};

export default AuthWrapper;

'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase-config';
import Auth from './Auth';

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0f0a08]">
            <p className="text-lg text-white">טוען...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0f0a08]">
            <p className="text-lg text-red-500">אירעה שגיאה: {error.message}</p>
        </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1d18] via-[#1a110e] to-[#0f0a08] flex items-center justify-center p-4">
      <Auth />
    </div>
  );
};

export default AuthWrapper;

'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthSplashScreen } from './auth-splash-screen';

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
    return <AuthSplashScreen />;
  }

  return <>{children}</>;
};

export default AuthWrapper;

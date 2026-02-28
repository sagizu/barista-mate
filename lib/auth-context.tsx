
'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null | undefined;
}

export const AuthContext = createContext<AuthContextType>({ user: null });

export const useAuth = () => useContext(AuthContext);

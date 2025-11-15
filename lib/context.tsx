'use client';

import React, { createContext, useContext, useState } from 'react';
import type { UserRole } from './mock-data';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, role: UserRole) => {
    setUser({
      id: Math.random().toString(),
      email,
      name: email.split('@')[0],
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

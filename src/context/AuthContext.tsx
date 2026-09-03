import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  shift?: string;
  role: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee';
  status: 'active' | 'inactive';
  attendanceRate?: number;
  avatarColor?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!api.getToken()) {
      setUser(null);
      return;
    }
    try {
      const res = await api.auth.getMe();
      setUser(res.data as AuthUser);
    } catch {
      api.setToken('');
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    const { token, user: loggedInUser } = res.data as { token: string; user: AuthUser };
    api.setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    api.setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { endpoints } from './api';

interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;

  updateUsername: (username: string) => Promise<void>;

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;

  logout: () => void;
}

const TOKEN_KEY = 'cinq_token';
const USER_KEY = 'cinq_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, userId: null, username: null });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);
    if (token) {
      let userId: number | null = null;
      let username: string | null = null;
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          userId = parsed.user_id ?? null;
          username = parsed.username ?? null;
        } catch {
          /* ignore corrupt cache */
        }
      }
      setState({ token, userId, username });
    }
    setIsReady(true);
  }, []);

  const persist = useCallback((token: string, userId: number, username: string) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify({ user_id: userId, username }));
    setState({ token, userId, username });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await endpoints.login({ username, password });
      persist(data.access_token, data.user_id, data.username || username);
    },
    [persist]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await endpoints.register({ username, email, password });
      // Registration doesn't return a token, so log in right after.
      await login(username, password);
    },
    [login]
  );


    const updateUsername = useCallback(
    async (newUsername: string) => {
      if (!state.token || !state.userId) {
        throw new Error('Not authenticated');
      }

      const cleanedUsername = newUsername.trim();

      if (!cleanedUsername) {
        throw new Error('Username cannot be empty.');
      }

      const data = await endpoints.updateUsername(
        state.token,
        cleanedUsername
      );

      window.localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          user_id: state.userId,
          username: data.username,
        })
      );

      setState((previous) => ({
        ...previous,
        username: data.username,
      }));
    },
    [state.token, state.userId]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!state.token || !state.userId) {
        throw new Error('Not authenticated');
      }

      await endpoints.changePassword(state.token, currentPassword, newPassword);
    },
    [state.token, state.userId]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setState({ token: null, userId: null, username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, isReady, login, register, updateUsername, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

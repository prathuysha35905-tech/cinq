'use client';

import { useAuth } from '@/lib/auth-context';
import AuthView from '@/components/AuthView';
import ChatApp from '@/components/ChatApp';

export default function Home() {
  const { token, isReady } = useAuth();

  if (!isReady) return null;

  return token ? <ChatApp /> : <AuthView />;
}

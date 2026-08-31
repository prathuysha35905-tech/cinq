'use client';

import { useCallback, useRef, useState } from 'react';
import { useAuth } from './auth-context';
import { endpoints, ApiError } from './api';
import type { AgentType, ChatMessage, SessionSummary } from './types';

let msgCounter = 0;

function nextId() {
  msgCounter += 1;
  return `m${msgCounter}`;
}

export function useChat() {
  const { token, logout } = useAuth();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSessionId;

  const guardAuth = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout();
      }
    },
    [logout]
  );

  // ==========================================
  // LOAD ALL SESSIONS
  // ==========================================

  const loadSessions = useCallback(async () => {
    if (!token) return [];

    try {
      const data = await endpoints.listSessions(token);

      const list = Array.isArray(data)
        ? data
        : data?.sessions || data?.items || [];

      const normalized: SessionSummary[] = list
        .map((s: any) => ({
          id: (s.session_id || s.id) as string,
          title: (s.title || s.name || null) as string | null,
        }))
        .filter((s) => Boolean(s.id));

      setSessions(normalized);

      return normalized;
    } catch (err) {
      guardAuth(err);
      return [];
    }
  }, [token, guardAuth]);

  // ==========================================
  // SELECT SESSION AND LOAD HISTORY
  // ==========================================

  const selectSession = useCallback(
    async (id: string) => {
      if (!token) return;

      setCurrentSessionId(id);
      setIsLoadingSession(true);
      setMessages([]);
      setChatError(null);

      try {
        const data = await endpoints.getSession(token, id);

        const history = (
          data.messages ||
          data.history ||
          data.chat_history ||
          []
        ) as Array<Record<string, unknown>>;

        const built: ChatMessage[] = [];

        if (Array.isArray(history)) {
          for (const item of history) {
            const role = (item.role || item.sender) as string | undefined;

            if (role === 'user') {
              built.push({
                id: nextId(),
                role: 'user',
                text: String(item.content ?? item.message ?? ''),
              });
            } else {
              built.push({
                id: nextId(),
                role: 'assistant',
                text: String(item.content ?? item.response ?? item.message ?? ''),
                agent: item.agent as string | undefined,
                model: item.model as string | undefined,
              });
            }
          }
        }

        setMessages(built);
      } catch (err) {
        guardAuth(err);

        setChatError(
          err instanceof Error
            ? err.message
            : 'Failed to load conversation'
        );
      } finally {
        setIsLoadingSession(false);
      }
    },
    [token, guardAuth]
  );

  // ==========================================
  // ENSURE A SESSION EXISTS
  // ==========================================

  const ensureSession = useCallback(async (): Promise<string> => {
    if (currentSessionIdRef.current) {
      return currentSessionIdRef.current;
    }

    if (!token) {
      throw new Error('You are not authenticated');
    }

    const data = await endpoints.createSession(token);

    const newId = (data.session_id || data.id) as string | null;

    if (!newId) {
      throw new Error('Backend did not return a session ID');
    }

    setSessions((prev) => [
      {
        id: newId,
        title: null,
      },
      ...prev,
    ]);

    setCurrentSessionId(newId);

    return newId;
  }, [token]);

  // ==========================================
  // CREATE A COMPLETELY NEW CHAT
  // ==========================================

  const newChat = useCallback(async () => {
    if (!token) return null;

    setMessages([]);
    setChatError(null);
    setCurrentSessionId(null);

    try {
      const data = await endpoints.createSession(token);

      const newId = (data.session_id || data.id) as string | null;

      if (!newId) {
        throw new Error('Backend did not return a session ID');
      }

      setSessions((prev) => [
        {
          id: newId,
          title: null,
        },
        ...prev,
      ]);

      setCurrentSessionId(newId);

      return newId;
    } catch (err) {
      guardAuth(err);

      setChatError(
        err instanceof Error
          ? err.message
          : 'Failed to create a new conversation'
      );

      return null;
    }
  }, [token, guardAuth]);

  // ==========================================
  // DELETE SESSION
  // ==========================================

  const deleteSession = useCallback(
    async (id: string) => {
      if (token) {
        try {
          await endpoints.deleteSession(token, id);
        } catch (err) {
          guardAuth(err);
        }
      }

      setSessions((prev) =>
        prev.filter((s) => s.id !== id)
      );

      if (currentSessionIdRef.current === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    },
    [token, guardAuth]
  );

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = useCallback(
    async (text: string, agent: AgentType) => {
      const trimmed = text.trim();

      if (!trimmed || !token) return;

      setChatError(null);

      const sessionId = await ensureSession();

      const existingSession = sessions.find(
        (s) => s.id === sessionId
      );

      const isFirst = !existingSession?.title;

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'user',
          text: trimmed,
        },
      ]);

      setIsSending(true);

      try {
        const data = await endpoints.chat(token, {
          session_id: sessionId,
          message: trimmed,
          agent,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: data.response,
            agent: data.agent,
            model: data.model,
            confidence: data.confidence,
          },
        ]);

        // Reload sessions so the AI-generated
        // conversation title appears in the sidebar.
        if (isFirst) {
          await loadSessions();
        }

      } catch (err) {
        guardAuth(err);

        const message =
          err instanceof Error
            ? err.message
            : 'Something went wrong';

        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant-error',
            text: `Error: ${message}`,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [
      token,
      ensureSession,
      sessions,
      guardAuth,
      loadSessions,
    ]
  );

  // ==========================================
  // RESET
  // ==========================================

  const reset = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    setChatError(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    messages,
    isLoadingSession,
    isSending,
    chatError,
    loadSessions,
    selectSession,
    newChat,
    deleteSession,
    sendMessage,
    reset,
  };
}
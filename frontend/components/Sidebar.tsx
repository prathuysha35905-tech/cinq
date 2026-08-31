'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import type { SessionSummary } from '@/lib/types';

interface SidebarProps {
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
}: SidebarProps) {
  const { username, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => (s.title || `Chat ${s.id.slice(0, 8)}`).toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Image className="brand-logo-sm pulse-glow" src="/logo.png" alt="CINQ logo" width={32} height={30} />
          <span className="sidebar-brand-name">CINQ</span>
        </div>
      </div>

      <button className="sidebar-new-chat" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="sidebar-sessions">
        {filteredSessions.length === 0 ? (
          <div style={{ padding: 10, fontSize: 'var(--fs-sm)', color: 'var(--color-text-tertiary)' }}>
            {sessions.length === 0 ? 'No conversations yet' : 'No matches'}
          </div>
        ) : (
          filteredSessions.map((s) => (
            <div
              key={s.id}
              className={'sidebar-session' + (s.id === currentSessionId ? ' sidebar-session-active' : '')}
              onClick={() => onSelectSession(s.id)}
            >
              <span className="sidebar-session-title">{s.title || `Chat ${s.id.slice(0, 8)}`}</span>
              <button
                className="sidebar-session-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(s.id);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-search">
        <div className="sidebar-search-input-wrap">
          <svg className="sidebar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{(username || '?').charAt(0).toUpperCase()}</div>
          <span className="sidebar-user-name">{username || '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="sidebar-icon-btn" title="Settings" onClick={onOpenSettings}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className="sidebar-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

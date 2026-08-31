'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import SettingsModal from './SettingsModal';
import { useChat } from '@/lib/use-chat';
import { prefs } from '@/lib/prefs';
import type { AgentType } from '@/lib/types';

const AGENT_STORAGE_KEY = 'cinq_default_agent';

export default function ChatApp() {
  const {
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
  } = useChat();

  const [agent, setAgent] = useState<AgentType>('auto');
  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [typingAnimation, setTypingAnimation] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(AGENT_STORAGE_KEY) as AgentType | null;
    if (saved) setAgent(saved);
    setTypingAnimation(prefs.getTypingAnimation());
    setAutoScroll(prefs.getAutoScroll());
  }, []);

  useEffect(() => {
    loadSessions().then((list) => {
      if (list && list.length && !currentSessionId) {
        selectSession(list[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoScroll && chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isSending, autoScroll]);

  async function handleDeleteAllConversations() {
    for (const s of sessions) {
      // eslint-disable-next-line no-await-in-loop
      await deleteSession(s.id);
    }
  }

  function handleDefaultAgentChange(next: AgentType) {
    setAgent(next);
    window.localStorage.setItem(AGENT_STORAGE_KEY, next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text, agent);
  }

  const currentTitle = sessions.find((s) => s.id === currentSessionId)?.title || 'New chat';

  return (
    <div className="chat-page">
      <div className="glitter-lines">
        <div className="glitter-line" style={{ top: '8%', ['--rot' as string]: '-8deg', ['--dur' as string]: '6s', ['--delay' as string]: '0s' }} />
        <div className="glitter-line" style={{ top: '28%', ['--rot' as string]: '-4deg', ['--dur' as string]: '7s', ['--delay' as string]: '1.5s' }} />
        <div className="glitter-line" style={{ top: '48%', ['--rot' as string]: '-10deg', ['--dur' as string]: '5.5s', ['--delay' as string]: '.8s' }} />
        <div className="glitter-line" style={{ top: '68%', ['--rot' as string]: '-5deg', ['--dur' as string]: '8s', ['--delay' as string]: '2.6s' }} />
        <div className="glitter-line" style={{ top: '88%', ['--rot' as string]: '-9deg', ['--dur' as string]: '6.8s', ['--delay' as string]: '1.9s' }} />
      </div>

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={newChat}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="chat-main">
        <header className="chat-header">
          <span className="chat-header-title">{currentTitle}</span>
          <div className="agent-selector">
            <span className="agent-selector-label">Agent</span>
            <select className="agent-selector-select" value={agent} onChange={(e) => setAgent(e.target.value as AgentType)}>
              <option value="auto">Auto</option>
              <option value="chat">Chat</option>
              <option value="math">Math</option>
              <option value="code">Code</option>
              <option value="writer">Writer</option>
              <option value="research">Research</option>
            </select>
          </div>
        </header>

        <div className="chat-window" ref={chatWindowRef}>
          {isLoadingSession ? (
            <LoadingIndicator label="Loading conversation…" />
          ) : chatError ? (
            <div className="form-error">Couldn&apos;t load this conversation: {chatError}</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--fs-sm)', marginTop: 'var(--space-8)' }}>
              Say hello to get started.
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isSending && <LoadingIndicator label="CINQ is thinking…" animate={typingAnimation} />}
            </>
          )}
        </div>

        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <div className="chat-input-shell">
            <textarea
              ref={textareaRef}
              className="chat-input-textarea"
              rows={1}
              placeholder="Message CINQ..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent);
                }
              }}
            />
            <button type="submit" className="chat-input-send" disabled={isSending}>
              ↑
            </button>
          </div>
          <div className="chat-input-hint">Enter to send · Shift+Enter for a new line</div>
        </form>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setTypingAnimation(prefs.getTypingAnimation());
          setAutoScroll(prefs.getAutoScroll());
        }}
        defaultAgent={agent}
        onDefaultAgentChange={handleDefaultAgentChange}
        sessionCount={sessions.length}
        onDeleteAllConversations={handleDeleteAllConversations}
        onRefreshSessions={loadSessions}
      />
    </div>
  );
}

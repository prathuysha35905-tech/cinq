'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getApiBase, setApiBase } from '@/lib/api';
import { prefs, type ResponseLength } from '@/lib/prefs';
import type { AgentType } from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  defaultAgent: AgentType;
  onDefaultAgentChange: (agent: AgentType) => void;
  sessionCount: number;
  onDeleteAllConversations: () => Promise<void> | void;
  onRefreshSessions: () => Promise<unknown> | void;
}

type Tab = 'account' | 'ai' | 'chat' | 'privacy' | 'danger';

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: '👤 Account' },
  { id: 'ai', label: '🤖 AI' },
  { id: 'chat', label: '💬 Chat' },
  { id: 'privacy', label: '🔒 Privacy' },
  { id: 'danger', label: '⚠️ Danger' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}

export default function SettingsModal({
  open,
  onClose,
  defaultAgent,
  onDefaultAgentChange,
  sessionCount,
  onDeleteAllConversations,
  onRefreshSessions,
}: SettingsModalProps) {
  const {
  username,
  updateUsername,
  changePassword,
  logout,
} = useAuth();
  const [tab, setTab] = useState<Tab>('account');
  const [apiBaseValue, setApiBaseValue] = useState('');
  const [savedLabel, setSavedLabel] = useState('Save');

  const [email, setEmail] = useState('');
  const [responseLength, setResponseLength] = useState<ResponseLength>('balanced');
  const [showAgent, setShowAgent] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [typingAnimation, setTypingAnimation] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
const [usernameValue, setUsernameValue] = useState('');

const [showPasswordForm, setShowPasswordForm] = useState(false);
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const [accountError, setAccountError] = useState('');
const [accountSuccess, setAccountSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setApiBaseValue(getApiBase());
    setEmail(prefs.getEmail());
    setResponseLength(prefs.getResponseLength());
    setShowAgent(prefs.getShowAgent());
    setShowConfidence(prefs.getShowConfidence());
    setTypingAnimation(prefs.getTypingAnimation());
    setAutoScroll(prefs.getAutoScroll());
    setTab('account');
    setFlash('');
    setUsernameValue(username || '');
setEditingUsername(false);

setShowPasswordForm(false);
setCurrentPassword('');
setNewPassword('');
setConfirmPassword('');

setAccountError('');
setAccountSuccess('');


  }, [open, username]);

  function handleSaveApiBase() {
    setApiBase(apiBaseValue);
    setApiBaseValue(getApiBase());
    setSavedLabel('Saved!');
    setTimeout(() => setSavedLabel('Save'), 1200);
  }

  function flashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(''), 1800);
  }

  async function handleClearPreferences() {
    prefs.resetAll();
    setResponseLength(prefs.getResponseLength());
    setShowAgent(prefs.getShowAgent());
    setShowConfidence(prefs.getShowConfidence());
    setTypingAnimation(prefs.getTypingAnimation());
    setAutoScroll(prefs.getAutoScroll());
    setEmail(prefs.getEmail());
    flashMsg('Preferences reset');
  }

  async function handleClearCache() {
    setBusy(true);
    try {
      await onRefreshSessions();
      flashMsg('Cache cleared');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm(`Delete all ${sessionCount} conversation(s)? This can't be undone.`)) return;
    setBusy(true);
    try {
      await onDeleteAllConversations();
    } finally {
      setBusy(false);
    }
  }


  async function handleUpdateUsername() {
  setAccountError('');
  setAccountSuccess('');

  if (!usernameValue.trim()) {
    setAccountError('Username cannot be empty.');
    return;
  }

  setBusy(true);

  try {
    await updateUsername(usernameValue);

    setEditingUsername(false);

    setAccountSuccess(
      'Username updated successfully.'
    );
  } catch (err) {
    setAccountError(
      err instanceof Error
        ? err.message
        : 'Failed to update username.'
    );
  } finally {
    setBusy(false);
  }
}

async function handleChangePassword() {
  setAccountError('');
  setAccountSuccess('');

  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    setAccountError(
      'Please fill in all password fields.'
    );

    return;
  }

  if (newPassword !== confirmPassword) {
    setAccountError(
      'New passwords do not match.'
    );

    return;
  }

  setBusy(true);

  try {
    await changePassword(
      currentPassword,
      newPassword
    );

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setShowPasswordForm(false);

    setAccountSuccess(
      'Password updated successfully.'
    );
  } catch (err) {
    setAccountError(
      err instanceof Error
        ? err.message
        : 'Failed to update password.'
    );
  } finally {
    setBusy(false);
  }
}




  return (
    <div
      className="settings-overlay"
      style={{ display: open ? 'flex' : 'none' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'settings-tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-body">
          {tab === 'account' && (
  <div>
    <div className="settings-section-title">
      Account
    </div>

    {accountError && (
      <div className="form-error">
        {accountError}
      </div>
    )}

    {accountSuccess && (
      <div
        className="settings-row-desc"
        style={{
          color: 'var(--color-accent)',
          marginBottom: 12,
        }}
      >
        {accountSuccess}
      </div>
    )}

    {/* Username */}

    <div
      className="settings-row"
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div className="settings-row-label">
          Username
        </div>

        {!editingUsername && (
          <button
            type="button"
            className="settings-select"
            onClick={() => {
              setUsernameValue(username || '');
              setEditingUsername(true);
              setAccountError('');
              setAccountSuccess('');
            }}
          >
            Edit
          </button>
        )}
      </div>

      {!editingUsername ? (
        <div className="settings-row-desc">
          {username || '—'}
        </div>
      ) : (
        <>
          <input
            type="text"
            className="settings-text-input"
            value={usernameValue}
            onChange={(e) =>
              setUsernameValue(e.target.value)
            }
            disabled={busy}
          />

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="settings-select"
              disabled={busy}
              onClick={() => {
                setEditingUsername(false);
                setUsernameValue(username || '');
                setAccountError('');
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '8px 14px',
              }}
              disabled={busy}
              onClick={handleUpdateUsername}
            >
              {busy
                ? 'Saving…'
                : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>

    {/* Email */}

    <div
      className="settings-row"
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
      }}
    >
      <div className="settings-row-label">
        Email address
      </div>

      <input
        type="email"
        className="settings-text-input"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        onBlur={() =>
          prefs.setEmail(email)
        }
        placeholder="you@example.com"
      />
    </div>

    {/* Password */}

    <div
      className="settings-row"
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div className="settings-row-label">
            Change password
          </div>

          <div className="settings-row-desc">
            Update your account password
          </div>
        </div>

        {!showPasswordForm && (
          <button
            type="button"
            className="settings-select"
            onClick={() => {
              setShowPasswordForm(true);
              setAccountError('');
              setAccountSuccess('');
            }}
          >
            Change
          </button>
        )}
      </div>

      {showPasswordForm && (
        <>
          <input
            type="password"
            className="settings-text-input"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
            disabled={busy}
          />

          <input
            type="password"
            className="settings-text-input"
            placeholder="New password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            disabled={busy}
          />

          <input
            type="password"
            className="settings-text-input"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            disabled={busy}
          />

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="settings-select"
              disabled={busy}
              onClick={() => {
                setShowPasswordForm(false);

                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');

                setAccountError('');
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '8px 14px',
              }}
              disabled={busy}
              onClick={handleChangePassword}
            >
              {busy
                ? 'Updating…'
                : 'Update password'}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
          {tab === 'ai' && (
            <div>
              <div className="settings-section-title">AI Preferences</div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Default agent</div>
                  <div className="settings-row-desc">Used when starting a new chat</div>
                </div>
                <select
                  className="settings-select"
                  value={defaultAgent}
                  onChange={(e) => onDefaultAgentChange(e.target.value as AgentType)}
                >
                  <option value="auto">Auto</option>
                  <option value="chat">Chat</option>
                  <option value="math">Math</option>
                  <option value="code">Code</option>
                  <option value="writer">Writer</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Response length</div>
                  <div className="settings-row-desc">Hint for how detailed replies should be</div>
                </div>
                <select
                  className="settings-select"
                  value={responseLength}
                  onChange={(e) => {
                    const v = e.target.value as ResponseLength;
                    setResponseLength(v);
                    prefs.setResponseLength(v);
                  }}
                >
                  <option value="short">Short</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Default model</div>
                  <div className="settings-row-desc">Optional — coming soon</div>
                </div>
                <span className="settings-tag-soon">Future</span>
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div>
              <div className="settings-section-title">Chat Preferences</div>
              <div className="settings-row">
                <div className="settings-row-label">Show selected agent</div>
                <Toggle
                  checked={showAgent}
                  onChange={(v) => {
                    setShowAgent(v);
                    prefs.setShowAgent(v);
                  }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Show routing confidence</div>
                <Toggle
                  checked={showConfidence}
                  onChange={(v) => {
                    setShowConfidence(v);
                    prefs.setShowConfidence(v);
                  }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Typing animation</div>
                <Toggle
                  checked={typingAnimation}
                  onChange={(v) => {
                    setTypingAnimation(v);
                    prefs.setTypingAnimation(v);
                  }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Auto-scroll messages</div>
                <Toggle
                  checked={autoScroll}
                  onChange={(v) => {
                    setAutoScroll(v);
                    prefs.setAutoScroll(v);
                  }}
                />
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <div className="settings-section-title">Privacy &amp; Data</div>
              <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div>
                  <div className="settings-row-label">API base URL</div>
                  <div className="settings-row-desc">Your CINQ FastAPI backend</div>
                </div>
                <input
                  type="text"
                  className="settings-text-input"
                  value={apiBaseValue}
                  onChange={(e) => setApiBaseValue(e.target.value)}
                  placeholder="http://localhost:8000"
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '8px 14px', alignSelf: 'flex-start' }}
                  onClick={handleSaveApiBase}
                >
                  {savedLabel}
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Clear local preferences</div>
                  <div className="settings-row-desc">Reset the options above to defaults</div>
                </div>
                <button className="settings-danger-btn" style={{ width: 'auto' }} onClick={handleClearPreferences}>
                  Clear
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Clear local cache/session data</div>
                  <div className="settings-row-desc">Reload conversations from the server</div>
                </div>
                <button className="settings-danger-btn" style={{ width: 'auto' }} disabled={busy} onClick={handleClearCache}>
                  Clear
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Export conversations</div>
                  <div className="settings-row-desc">Coming soon</div>
                </div>
                <span className="settings-tag-soon">Future</span>
              </div>
              {flash && <div className="settings-row-desc" style={{ color: 'var(--color-accent)' }}>{flash}</div>}
            </div>
          )}

          {tab === 'danger' && (
            <div>
              <div className="settings-section-title">Danger zone</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="settings-danger-btn" onClick={logout}>
                  Log out
                </button>
                <button className="settings-danger-btn" disabled={busy || sessionCount === 0} onClick={handleDeleteAll}>
                  Delete all conversations
                </button>
                <button className="settings-danger-btn" disabled title="Coming soon">
                  Delete account (coming soon)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

export type ResponseLength = 'short' | 'balanced' | 'detailed';

const KEYS = {
  email: 'cinq_email',
  responseLength: 'cinq_response_length',
  defaultModel: 'cinq_default_model',
  showAgent: 'cinq_show_agent',
  showConfidence: 'cinq_show_confidence',
  typingAnimation: 'cinq_typing_animation',
  autoScroll: 'cinq_auto_scroll',
} as const;

function getBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === '1';
}

function setBool(key: string, value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value ? '1' : '0');
}

function getStr(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function setStr(key: string, value: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

export const prefs = {
  keys: KEYS,
  getEmail: () => getStr(KEYS.email, ''),
  setEmail: (v: string) => setStr(KEYS.email, v),
  getResponseLength: (): ResponseLength => getStr(KEYS.responseLength, 'balanced') as ResponseLength,
  setResponseLength: (v: ResponseLength) => setStr(KEYS.responseLength, v),
  getDefaultModel: () => getStr(KEYS.defaultModel, ''),
  setDefaultModel: (v: string) => setStr(KEYS.defaultModel, v),
  getShowAgent: () => getBool(KEYS.showAgent, true),
  setShowAgent: (v: boolean) => setBool(KEYS.showAgent, v),
  getShowConfidence: () => getBool(KEYS.showConfidence, false),
  setShowConfidence: (v: boolean) => setBool(KEYS.showConfidence, v),
  getTypingAnimation: () => getBool(KEYS.typingAnimation, true),
  setTypingAnimation: (v: boolean) => setBool(KEYS.typingAnimation, v),
  getAutoScroll: () => getBool(KEYS.autoScroll, true),
  setAutoScroll: (v: boolean) => setBool(KEYS.autoScroll, v),
  resetAll: () => {
    if (typeof window === 'undefined') return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};

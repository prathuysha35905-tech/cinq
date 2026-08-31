export type AgentType = 'auto' | 'chat' | 'math' | 'code' | 'writer' | 'research';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  agent: string;
  confidence: number;
  reason: string;
  model: string;
  routing_method: string;
}

export interface SessionSummary {
  id: string;
  title: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'assistant-error';
  text: string;
  agent?: string;
  model?: string;
  confidence?: number;
}

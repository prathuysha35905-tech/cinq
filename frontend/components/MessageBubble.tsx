import type { ChatMessage } from '@/lib/types';
import { prefs } from '@/lib/prefs';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'assistant-error';
  const showAgent = prefs.getShowAgent();
  const showConfidence = prefs.getShowConfidence();

  return (
    <div className={'chat-message ' + (isUser ? 'chat-message-user' : 'chat-message-assistant')}>
      <div
        className="chat-message-bubble"
        style={
          isError
            ? {
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
              }
            : undefined
        }
      >
        <p className="chat-message-text" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {message.text}
        </p>
      </div>
      {!isUser && !isError && showAgent && (message.agent || message.model) && (
        <div className="chat-message-agent-label">
          {[message.agent, message.model].filter(Boolean).join(' · ')}
          {showConfidence && typeof message.confidence === 'number' && (
            <> · {Math.round(message.confidence * 100)}% confidence</>
          )}
        </div>
      )}
    </div>
  );
}

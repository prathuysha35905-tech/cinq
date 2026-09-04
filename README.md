 CINQ – AI-Powered Multi-Agent Assistant

CINQ is an AI-powered conversational assistant built using a multi-agent architecture. The application analyzes a user's request, routes it to the most appropriate AI agent, and generates a response based on the requested task.

The project includes user authentication, persistent chat sessions, conversation history, AI-based request routing, specialized agents, and optional web search capabilities.

---

Features

- User registration and authentication
- JWT-based authentication
- Persistent chat sessions
- Conversation history
- Automatic conversation title generation
- AI-powered request routing
- Multiple specialized AI agents
- Fallback agent handling
- Mathematical query handling
- Code-related query handling
- Research-oriented query handling
- Writing assistance
- General chat support
- Optional web search integration using Tavily
- PostgreSQL database integration
- Modern responsive frontend
- Local AI model support through LM Studio
- Environment-based configuration

---

# AI Architecture

CINQ uses a routing-based multi-agent architecture.

When a user sends a message:

1. The message is received by the FastAPI backend.
2. The AI router analyzes the request.
3. The router determines which specialized agent should handle the request.
4. The selected agent generates a response.
5. If routing fails, CINQ uses a fallback agent.
6. The conversation is stored in the PostgreSQL database.
7. The response is returned to the frontend.

## Available Agents

The project includes specialized agents for different types of requests:

- Chat Agent
- Code Agent
- Math Agent
- Research Agent
- Writer Agent

This architecture makes it easier to extend the system by adding new agents in the future.

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- CSS

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy

## Database

- PostgreSQL

## AI Integration

- LM Studio
- OpenAI-compatible API
- Local Large Language Models

## Additional Services

- Tavily API for web search
- JWT for authentication

---

# Project Structure

```text
cinq/
│
├── backend/
│   │
│   ├── app/
│   │   │
│   │   ├── agents/
│   │   │   ├── base.py
│   │   │   ├── chat_agent.py
│   │   │   ├── code_agent.py
│   │   │   ├── math_agent.py
│   │   │   ├── research_agent.py
│   │   │   ├── writer_agent.py
│   │   │   └── registry.py
│   │   │
│   │   ├── core/
│   │   │   ├── auth_dependencies.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── logger.py
│   │   │
│   │   ├── models/
│   │   │   ├── adapter.py
│   │   │   ├── conversation.py
│   │   │   └── user.py
│   │   │
│   │   ├── router/
│   │   │   ├── auth.py
│   │   │   ├── classifier.py
│   │   │   ├── llm_router.py
│   │   │   ├── router.py
│   │   │   ├── rules.py
│   │   │   ├── semantic.py
│   │   │   └── sessions.py
│   │   │
│   │   ├── schemas/
│   │   │   └── chat.py
│   │   │
│   │   ├── services/
│   │   │   └── conversation_service.py
│   │   │
│   │   ├── tools/
│   │   │   └── web_search.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── tests/
│
├── frontend/
│   │
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── AuthView.tsx
│   │   ├── CatStage.tsx
│   │   ├── ChatApp.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SettingsModal.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth-context.tsx
│   │   ├── prefs.ts
│   │   ├── types.ts
│   │   └── use-chat.ts
│   │
│   ├── public/
│   ├── package.json
│   └── next.config.mjs
│
└── .gitignore

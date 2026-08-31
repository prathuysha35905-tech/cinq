# CINQ Frontend

A Next.js (App Router + TypeScript) frontend for the CINQ FastAPI backend — register/login with a JWT, create and browse chat sessions, and talk to the `/api/v1/chat` agent router.

## Structure

```
frontend/
├── package.json          Next.js 14, React 18, TypeScript
├── next.config.mjs
├── tsconfig.json
├── app/                  App Router pages
│   ├── layout.tsx        Loads fonts, wraps the app in AuthProvider
│   ├── page.tsx          Shows AuthView or ChatApp depending on auth state
│   └── globals.css       All styling (ported from the CINQ design mockup)
├── components/
│   ├── AuthView.tsx      Login + register forms
│   ├── ChatApp.tsx        Chat page: header, window, composer, settings
│   ├── Sidebar.tsx        Session list, new chat, user footer
│   ├── MessageBubble.tsx  A single chat message
│   ├── LoadingIndicator.tsx
│   └── SettingsModal.tsx  Default agent, account, API base URL, sign out
├── lib/
│   ├── api.ts             Typed fetch client for the FastAPI backend
│   ├── auth-context.tsx   JWT/user state, persisted to localStorage
│   ├── use-chat.ts        Sessions + messages state and actions
│   └── types.ts           Shared TypeScript types
└── public/
    └── logo.png           CINQ logo
```

## Backend contract

This talks to a FastAPI backend at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`), matching the spec you gave:

- `POST /api/v1/auth/register` — `{ username, email, password }`
- `POST /api/v1/auth/login` — `{ username, password }` → `{ access_token, token_type, user_id, username }`
- `GET/POST /api/v1/sessions`, `GET/DELETE /api/v1/sessions/{id}`
- `POST /api/v1/chat` — `{ session_id, message, agent }` → `{ session_id, response, agent, confidence, reason, model, routing_method }`

The JWT is sent as `Authorization: Bearer <token>` on every authenticated request. A 401 on any authenticated call logs the user out automatically.

**Note on `GET /api/v1/sessions` and `GET /api/v1/sessions/{id}`:** their response shapes weren't in the spec you shared, so `lib/use-chat.ts` parses them defensively — it looks for `session_id`/`id`, `title`/`name`, and a `messages`/`history`/`chat_history` array. If your actual response looks different, share a sample payload and I'll tighten the parsing.

## Running it

```bash
cd frontend
npm install
cp .env.local.example .env.local   # adjust NEXT_PUBLIC_API_BASE_URL if needed
npm run dev
```

Then open http://localhost:3000 (with your FastAPI backend running on the configured base URL).

You can also change the API base URL at runtime from the app itself: Settings → Connection → API base URL (stored in `localStorage`, overrides the env default).

## What's different from the static HTML mockup

- All state (auth, sessions, messages) now goes through real `fetch` calls instead of `localStorage`-only fakes.
- The decorative animated cat mascots are ported as `components/CatStage.tsx`, a client component mounted once in `app/layout.tsx` so it persists across the auth and chat views, matching the original mockup's behavior exactly (same markup, CSS, and animation logic — just adapted from direct DOM manipulation to React refs).
- Chat responses render as plain text (line breaks preserved), not full Markdown/code-block rendering.

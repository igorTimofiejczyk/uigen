# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates code into a virtual file system, which is compiled and rendered in real time.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run dev:daemon   # Start dev server in background, logs to logs.txt
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit/component tests)
npm run test -- src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run setup        # Install deps + Prisma generate & migrate
npm run db:reset     # Reset SQLite database
```

Environment: copy `.env.example` to `.env` and add `ANTHROPIC_API_KEY`. Without the key, the app falls back to a mock AI provider.

## Architecture

### Data Flow

1. User submits a message in `ChatInterface`
2. `ChatProvider` POSTs to `/api/chat` with current messages and virtual file state
3. The API route streams a Claude response using Vercel AI SDK with two tools:
   - `str_replace_editor` — creates or edits files (create, str_replace, insert operations)
   - `file_manager` — renames or deletes files
4. Tool calls are parsed on the client and applied to the virtual file system via `FileSystemProvider`
5. `PreviewFrame` compiles the active file with Babel Standalone and renders it in an iframe

### Key Contexts

- **`ChatProvider`** (`src/context/ChatContext.tsx`) — message list, streaming state, form submission
- **`FileSystemProvider`** (`src/context/FileSystemContext.tsx`) — in-memory virtual file tree; serializes to JSON for project persistence

### Virtual File System

All generated code lives entirely in memory (no disk writes). The file tree is serialized as JSON and stored in the `Project.data` column (SQLite via Prisma) when a user saves a project.

### Authentication

JWT sessions (`jose`) with bcrypt passwords. Session token stored in an HTTP-only cookie. Server Actions in `src/actions/` handle sign-up, sign-in, sign-out, and project CRUD. Anonymous users can use the generator without saving.

### AI Provider

`src/lib/ai-provider.ts` exports a configured Anthropic client. If `ANTHROPIC_API_KEY` is absent, a mock provider is used so the app still runs.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | Radix UI, shadcn/ui |
| Code editor | Monaco Editor |
| In-browser compile | Babel Standalone |
| AI SDK | Vercel AI SDK + `@ai-sdk/anthropic` |
| Database | SQLite via Prisma |
| Testing | Vitest + Testing Library (jsdom) |

## Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`).

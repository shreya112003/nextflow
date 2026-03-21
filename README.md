# NextFlow — LLM Workflow Builder

A pixel-perfect, production-grade visual LLM workflow builder inspired by Krea.ai.
Built with Next.js 14, TypeScript, React, Tailwind CSS, Zustand, Clerk, Prisma + Neon PostgreSQL,
Trigger.dev for task execution, Transloadit for file uploads, and Google Gemini for AI.

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd nextflow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in each key — see **Getting API Keys** below.

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Getting API Keys

| Service | URL | Notes |
|---|---|---|
| **Google Gemini** | https://aistudio.google.com/app/apikey | Free tier available |
| **Clerk** | https://clerk.com | Create app → get publishable + secret keys |
| **Neon PostgreSQL** | https://neon.tech | Create project → copy connection string |
| **Trigger.dev** | https://cloud.trigger.dev | Create project → Settings → API Keys |
| **Transloadit** | https://transloadit.com | Account → API Credentials |

---

## Project Structure

```
nextflow/
├── prisma/
│   └── schema.prisma          # DB schema (User, Workflow, WorkflowRun, NodeResult)
├── trigger/
│   └── tasks.ts               # Trigger.dev tasks: llm-node, crop-image, extract-frame
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with ClerkProvider
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css
│   │   ├── sign-in/            # Clerk sign-in
│   │   ├── sign-up/            # Clerk sign-up
│   │   ├── workflow/
│   │   │   └── page.tsx        # Protected workflow builder page (Server Component)
│   │   └── api/
│   │       ├── workflows/
│   │       │   ├── route.ts    # GET/POST save workflow
│   │       │   └── [id]/
│   │       │       ├── history/route.ts   # GET run history
│   │       │       └── export/route.ts    # GET export JSON
│   │       └── run/
│   │           └── route.ts    # POST run workflow (SSE streaming)
│   ├── components/
│   │   ├── WorkflowBuilder.tsx # Main client shell
│   │   ├── canvas/
│   │   │   ├── WorkflowCanvas.tsx  # SVG canvas, pan/zoom/drag/connect
│   │   │   ├── EdgeLine.tsx        # Animated edges
│   │   │   └── MiniMap.tsx         # Bottom-right minimap
│   │   ├── nodes/
│   │   │   └── NodeCard.tsx        # All 6 node type renders
│   │   └── ui/
│   │       ├── TopBar.tsx          # Top action bar
│   │       ├── LeftSidebar.tsx     # Node palette (collapsible)
│   │       ├── RightSidebar.tsx    # Workflow history panel
│   │       └── NodeInspector.tsx   # Bottom inspector for selected node
│   ├── hooks/
│   │   ├── useRunWorkflow.ts   # SSE streaming run hook
│   │   └── useSaveWorkflow.ts  # Auto-save with debounce
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── gemini.ts           # Google Generative AI helper
│   │   ├── dag.ts              # Topological sort + parallel execution planner
│   │   ├── validators.ts       # Zod schemas
│   │   └── sampleWorkflow.ts   # Pre-built Product Marketing Kit workflow
│   ├── store/
│   │   └── workflow.ts         # Zustand store with immer (undo/redo)
│   ├── types/
│   │   └── index.ts            # All TypeScript types
│   └── middleware.ts           # Clerk auth middleware
```

---

## Architecture

### Execution Engine

All node executions go through **Trigger.dev tasks** (per spec requirement):

- `llm-node` — calls Gemini API with optional image vision
- `crop-image` — FFmpeg crop via Transloadit assembly
- `extract-frame` — FFmpeg video frame extraction via Transloadit

In development without Trigger.dev configured, the API falls back to direct Gemini calls and simulated results.

### DAG Execution

`src/lib/dag.ts` implements Kahn's algorithm for topological sort. Nodes in the same tier have no dependencies between each other and run **concurrently via `Promise.all`**. This satisfies the parallel execution requirement.

### Real-time Updates

The `/api/run` route returns a **Server-Sent Events stream**. The client (`useRunWorkflow.ts`) reads the SSE stream and updates node statuses in real-time as each node completes.

### Data Flow (Sample Workflow)

```
Branch A                          Branch B
────────────────────────          ────────────────────
Text #1 (System Prompt) ──┐       Upload Video ────┐
Text #2 (Product Info)  ──┼─→ LLM #1             Extract Frame ─┐
Upload Image ──→ Crop ───┘                                       │
                           └─────────────────────────→ LLM #2 ←─┘
                                                  (waits for BOTH)
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables from `.env.example`
4. Deploy

Vercel automatically detects Next.js and configures build settings.

---

## Required Deliverables Checklist

- [x] Pixel-perfect Krea-inspired dark UI
- [x] Clerk authentication with protected routes
- [x] Left sidebar with 6 node type buttons
- [x] Right sidebar with workflow history panel
- [x] Node-level execution history (click to expand)
- [x] React Flow-style canvas with dot grid background
- [x] Text Node with textarea and output handle
- [x] Upload Image Node with file input and preview
- [x] Upload Video Node with file input and preview
- [x] LLM Node with model selector and run capability
- [x] Crop Image Node (FFmpeg via Trigger.dev)
- [x] Extract Frame from Video Node (FFmpeg via Trigger.dev)
- [x] All node executions via Trigger.dev tasks
- [x] Pulsating glow effect on running nodes
- [x] Pre-built sample workflow (Product Marketing Kit)
- [x] Node connections with animated edges
- [x] API routes with Zod validation
- [x] Google Gemini integration with vision support
- [x] TypeScript throughout with strict mode
- [x] PostgreSQL with Prisma ORM
- [x] Workflow history persistence to database
- [x] Workflow export/import as JSON
- [x] DAG validation (cycle prevention)
- [x] Parallel execution (concurrent tier processing)
- [x] Undo/redo for node operations
- [x] MiniMap navigation
- [x] Keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Y)
- [x] Auto-save with debounce
- [x] SSE real-time streaming execution updates

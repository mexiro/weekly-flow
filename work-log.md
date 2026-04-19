# WeeklyFlow — Work Log

**Date:** April 6, 2026  
**Status:** Phases 1–7 complete

---

## Phase 1 — Project Scaffold

- Scaffolded with `npm create vite@latest weeklyflow -- --template react-ts`
- Installed all dependencies: Tiptap, @dnd-kit, Zustand, date-fns, Tailwind CSS v4
- Configured Tailwind via `@tailwindcss/vite` plugin (no postcss)
- Loaded Google Fonts (Inter + Source Serif 4) in `index.html`
- Verified dev server runs at `http://localhost:5173`

---

## Phase 2 — Layout & Sidebar

- `AppLayout.tsx` — full-height flex layout, sidebar left, content area fills rest
- `Sidebar.tsx` — dark sidebar (`#1a1a2e`), 220px wide, with WeeklyFlow logo/title
- `WeekList.tsx` — lists weekly pages sorted by recency, active item highlighted with indigo left border and background
- `ViewSwitcher.tsx` — pill toggle at sidebar bottom for Editor / Kanban views, with ⌘K hint
- CSS design tokens in `:root` (--accent, --bg-sidebar, --text-primary, etc.)
- All layout and sidebar components use inline styles to avoid Tailwind conflicts

---

## Phase 3 — Rich Text Editor

- `WeeklyEditor.tsx` — Tiptap editor with full-width left-aligned layout, left padding, no max-width cap
- Extensions: StarterKit, TaskList, TaskItem, Placeholder
- Page header: clickable emoji icon (cycles through 10 options), editable title (contentEditable), date range subtitle
- Default week template: H1 Goals + Mon–Fri H2 headings each with an empty task list
- Auto-save on every change, debounced 500ms → Zustand store → localStorage
- Custom styled checkboxes (replaces browser defaults): indigo fill when checked, smooth transitions
- Checked tasks show strikethrough + muted gray color
- `BubbleMenu.tsx` — custom floating toolbar on text selection (Bold, Italic, Strike, H1, H2, Code), positioned via `editor.view.coordsAtPos()`
- Editor font: Source Serif 4 at 13px / 1.5 line-height
- H2 headings (day sections) have 1.1em top margin with a subtle border-bottom divider

---

## Phase 4 — Task Parser

- `taskIdentity.ts` — normalizes task titles (lowercase, trim, strip punctuation), generates deterministic ID via 32-bit hash keyed on `weekId + dayLabel + normalizedTitle`
- `taskParser.ts` — walks Tiptap JSON tree, tracks current day section from H2 headings (Monday–Friday), extracts `taskItem` nodes with checked state → maps to `todo` / `done` status
- Parser runs on every editor save (debounced) and on page mount
- Results pushed to `taskStore` (Zustand, in-memory only — tasks are always derived from content)

---

## Phase 5 — Kanban Board

- `KanbanBoard.tsx` — three-column layout (To Do / Doing / Done) using @dnd-kit
- `KanbanColumn.tsx` — droppable zone with color-coded dot header, task count badge, highlights on drag-over
- `KanbanCard.tsx` — draggable card showing task title, day label tag, week badge
- Drag & drop with `PointerSensor` (5px activation distance to avoid accidental drags)
- `DragOverlay` renders a ghost card while dragging
- Kanban filtered to active week by default

---

## Phase 6 — Two-Way Sync

- **Editor → Kanban:** every editor save re-parses tasks and updates `taskStore`; Kanban re-renders automatically via Zustand subscription
- **Kanban → Editor:** dragging a card to a new column walks the Tiptap JSON and flips the matching `taskItem`'s `checked` attribute, then calls `updatePageContent` to persist
- Loop prevention: `isExternalUpdate` ref flag in `WeeklyEditor` blocks `onUpdate` from re-saving when content is set programmatically from Kanban
- `useEffect` on `page.content` in `WeeklyEditor` picks up Kanban writes and syncs them into the live editor instance (checkboxes update visually without page reload)
- `onDragOver` tracks destination column continuously so `onDragEnd` always resolves the correct target column regardless of whether the drop lands on a card or empty column space

---

## Phase 7 — Polish

- **Cmd/Ctrl+K** keyboard shortcut toggles between Editor and Kanban views globally
- **Smooth fade transition** (0.18s opacity) when switching views — both views rendered simultaneously with `pointer-events` toggled
- **"now" badge** on current week in sidebar (indigo pill, uppercase)
- **Empty state** when no week is selected — icon + instruction text
- **⌘K hint** shown in sidebar next to View label

---

## Additional Features (beyond original plan)

### New Week Modal
- Clicking "+ New" in the sidebar opens a modal instead of immediately creating a page
- **Suggestions tab:** lists next 5 weeks that don't already exist, click to create instantly
- **Manual entry tab:** enter any week number (1–53) + year, press Enter or "Create week" button
- Closes on Escape or backdrop click
- Validation on manual entry (week range, year range)

---

## Data Persistence

| Key | Contents |
|-----|----------|
| `weeklyflow:pages` | All weekly pages (Tiptap JSON content + metadata) |
| `weeklyflow:ui` | Active week ID + active view |

Tasks are **not** persisted — always derived from page content by the parser on load.

---

## Phase 9 — PLANNED: Project Lifecycle + Cross-Week Continuity (Apr 17, 2026)

> **Status:** Plan only. Not yet implemented. Three tightly-related changes, ordered by independence.

---

### 9A. Project Auto-Completion + Archive

**Goal:** When every subtask of a project is done, automatically mark it as completed, stamp the completion date, and remove it from the active board. Archived projects are recoverable from a separate view.

**Data model changes** (`types/index.ts`):
```typescript
interface Project {
  id: string
  title: string
  assignee?: string
  tasks: ProjectTask[]
  createdAt: string
  updatedAt: string
  // new fields:
  completedAt?: string      // ISO date when all tasks were marked done
  archivedAt?: string       // ISO date when archived (auto or manual)
  status: 'active' | 'completed' | 'archived'
}
```

Migration: `persist` middleware will load older records without `status` — add a `version: 2` migration in `projectStore.ts` that defaults `status: 'active'` for existing projects.

**Store changes** (`projectStore.ts`):
- New action: `archiveProject(id)` — sets `archivedAt`, `status: 'archived'`
- New action: `unarchiveProject(id)` — clears `archivedAt`, recomputes status from tasks
- Modify `toggleTask`: after toggling, check if all tasks are done AND tasks.length > 0. If yes, set `completedAt = now` + `status: 'completed'`. If a task is unchecked from a completed project, clear `completedAt` and revert to `status: 'active'`.
- Selector: `getActiveProjects()` returns only `status === 'active'`
- Selector: `getArchivedProjects()` returns `status === 'archived' || status === 'completed'`

**UI changes:**
- `ProjectsBoard.tsx`: filters to active projects only. Add a footer link "View archived (N)" that toggles to an archive view.
- New `ArchivedProjectsView.tsx`: list (not grid) of archived/completed projects, each row shows title, completion date, "Restore" button. Read-only task list expandable on click.
- `ProjectCard.tsx`: when project becomes `completed` (all tasks done), show a brief inline "✓ Completed" badge for ~2 seconds before the card animates out (fade + slide). Use a `useEffect` watching `project.status`.
- Manual archive: add an "Archive" option in the card's `×` menu (turn `×` into a small dropdown with Archive / Delete).

**Edge cases:**
- A project with zero tasks should NEVER auto-complete (the `tasks.length > 0` guard above).
- If user adds a new task to a completed project, status reverts to `active`, `completedAt` cleared.
- Archive shows newest-first by `completedAt || archivedAt`.

---

### 9B. "Open for N weeks" Counter

**Goal:** Show how long each project has been open. When completed, show the completion date.

**Computation** (no schema change beyond 9A):
- Open duration: `weeksBetween(project.createdAt, now)` — use `differenceInCalendarWeeks` from `date-fns`. Display as "Open 3w" or "Open 1w" (always weeks, never days).
- Completed display: "✓ Completed Apr 12" — short date, no year unless different from current year.

**UI:**
- `ProjectCard.tsx`: small muted line under the assignee pill:
  - Active: `Open 3w` (or `Opened today` if < 1 week)
  - Completed: `Completed Apr 12 · 5w total`
- Style: Inter 11px, `var(--text-secondary)`, no icon.

**Edge cases:**
- Round down: 6 days = "Open this week", 7+ days = "Open 1w".
- Use `getCurrentDate()` helper (not `new Date()` directly) so it's testable later.

---

### 9C. BIG FEATURE — Cross-Week Task Continuity

> **This is the meaningful architectural change.** Tasks created in CW4 that remain unchecked should keep showing up in the Kanban regardless of which week is currently active. The Kanban becomes a true global view of all open work.

**The problem with today's model:**

Right now, tasks are derived per-week and the Kanban filters by `activeWeekId` (see [KanbanBoard.tsx:90](weeklyflow/src/components/Kanban/KanbanBoard.tsx#L90)). Switch weeks → the Kanban only shows that week's tasks. There's no concept of a task "still being open" across weeks.

The task identity hash also includes `weekId` and `dayLabel` ([taskIdentity.ts:21](weeklyflow/src/utils/taskIdentity.ts#L21)), so the SAME task copy-pasted into two weeks creates two distinct task IDs. We need a way to recognize a task as "the same task" across weeks.

**Two design options — pick one before building:**

#### Option 1: Pure derivation (no new persistence)

Keep tasks derived from the editor. Rules:
- Kanban shows the union of `parseTasks(page.content)` across **all** pages, not just active week
- A task is "still open" if its most recent occurrence (across all weeks) is unchecked
- Identity: hash by normalized title only (drop `weekId` + `dayLabel` from the hash). Two pages with the same task text = one task.
- "Carry-over" badge on Kanban card: `From CW4 · 3 weeks open` if the task first appeared in an earlier week than the active one.

**Pros:** No new storage. Editor remains source of truth. Backwards compatible.
**Cons:** Title collisions across genuinely different tasks would merge them. Renaming a task in one week creates a new task and orphans the old one.

#### Option 2: Persistent task layer (recommended)

Promote tasks from "derived" to "persisted, with editor sync."

New store: `taskStore` becomes persisted with key `weeklyflow:tasks`. Tasks gain:
```typescript
interface Task {
  id: string                  // stable nanoid (not a hash)
  title: string
  status: 'todo' | 'doing' | 'done'
  originWeekId: string        // first week it appeared
  occurrences: Array<{        // every (weekId, dayLabel) where it shows in editor
    weekId: string
    dayLabel: string
  }>
  createdAt: string
  completedAt?: string
  lastUpdated: string
}
```

Parser change: `parseTasks` becomes `reconcileTasks(allPages)` — runs on any editor save, walks every page, and produces a deduped task list. Matching logic:
1. Strict match: existing task whose `(title normalized) + (originWeekId)` matches → reuse
2. Fuzzy match: existing task whose normalized title matches AND status is still `todo` → reuse, append occurrence
3. No match → create new task with new nanoid

Kanban becomes global by default (no `activeWeekId` filter). Optional filter chip: "All weeks" | "This week only".

**Pros:** Tasks have stable identity. Renames work. Notes/metadata can attach to tasks. Foundation for due dates.
**Cons:** Reconciliation logic is non-trivial. Must handle: task deleted from editor (mark as removed? keep as orphan?), task moved between weeks, identical titles in different contexts.

**Recommendation:** Go with Option 2. The current "derived only" model is hitting its limit — you've already added persisted projects, and tasks deserve the same treatment.

**UI consequences (Option 2):**
- `KanbanBoard.tsx`: remove `activeWeekId` filter. Add a sticky filter bar: `[All open] [This week] [Carried over (N)]`
- `KanbanCard.tsx`: add a "carried over" indicator when `originWeekId !== activeWeekId`. Show "From CW4 · 3w open".
- Sidebar: small badge per week showing how many of its tasks are still open in later weeks.

**Carry-over count calculation:**
- For each task: `weeksOpen = differenceInCalendarWeeks(now, task.createdAt)` (when active) or `differenceInCalendarWeeks(completedAt, createdAt)` (when done).

**Migration risk:**
- Wiping `weeklyflow:tasks` on first load of v2 and rebuilding from scratch via `reconcileTasks` is acceptable — tasks are still derivable from page content. Just lose any in-memory `lastUpdated` timestamps (not user-visible).

---

### Build order (when we execute)

1. **9A first** (smallest, isolated to projects)
2. **9B second** (purely additive, depends on 9A's `completedAt`)
3. **9C last** (big rewrite of task pipeline — needs its own planning session before code)

For 9C specifically: before writing any code, prototype `reconcileTasks` in isolation with sample inputs and verify the matching logic on edge cases (renamed tasks, duplicate titles, deletions). That function is the whole feature — get it right on paper first.

---

## Phase 8 — Projects Kanban Tab (Apr 17, 2026)

- New `KanbanTab` type (`'week' | 'projects'`) in `types/index.ts`
- New `Project` + `ProjectTask` interfaces in `types/index.ts`
- `store/projectStore.ts` — Zustand + persist, full CRUD: addProject, updateProjectTitle, updateProjectAssignee, deleteProject, addTask, toggleTask, updateTaskText, deleteTask. Persisted to `weeklyflow:projects`
- `KanbanTabs.tsx` — tab bar (This Week / Projects), active tab has indigo bottom border
- `ProjectTaskRow.tsx` — subtask row with custom checkbox, double-click to edit text inline, empty-on-blur auto-deletes row
- `ProjectCard.tsx` — project card with inline editable title + assignee, progress bar, task list, "+ add task" input, × delete button (visible on hover)
- `EmptyProjectsState.tsx` — empty state with CTA when no projects exist
- `ProjectsBoard.tsx` — responsive grid of ProjectCards, "+ New Project" button, soft-limit warning at ≥5 projects
- `KanbanBoard.tsx` updated — tab state added, KanbanTabs rendered below header, "This Week" and "Projects" views conditionally rendered. Existing DnD/task-sync logic untouched.
- CSS added: `.project-checkbox` (matches editor checkboxes), `.project-task-row:hover` highlight

---

## Slash Command / Block Picker (Apr 17, 2026)

- New `SlashCommand.ts` extension using Tiptap `suggestion` API + `tippy.js` for popup positioning
- New `SlashMenu.tsx` — keyboard-navigable dropdown (↑↓ arrows, Enter to confirm, Escape to close)
- Available commands: Task List, Heading 1, Heading 2, Bullet List, Numbered List, Quote, Code Block
- Triggered by typing `/` anywhere in the editor; filtered by typing (e.g. `/task`, `/head`)
- Installed `tippy.js` and `@tiptap/suggestion` packages
- Default week template updated: day sections now start with empty paragraphs instead of pre-filled task lists
- New weeks are clean text — users add task lists on demand via `/task`

---

## Spacing & Typography Fixes (Apr 17, 2026)

- Reduced `.weeklyflow-editor` `padding-top` from 28px → 16px (less gap between divider and first heading)
- Added `h1:first-child { margin-top: 0 }` so "Week N — Goals" sits snugly below the divider
- Reduced H1 `margin-top` from 1.4em → 0.6em for subsequent H1s
- Reduced sibling gap `> * + *` from 0.2em → 0.15em (tighter paragraph spacing)
- Added `line-height: 1.6` on `p` for readable but compact body text
- Reduced task list item padding from 3px → 2px per row
- Divider `marginBottom` set to 4px (was 0) for breathing room before content

---

## File Structure

```
src/
├── components/
│   ├── Layout/AppLayout.tsx
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── WeekList.tsx
│   │   ├── ViewSwitcher.tsx
│   │   └── NewWeekModal.tsx
│   ├── Editor/
│   │   ├── WeeklyEditor.tsx
│   │   └── menus/BubbleMenu.tsx
│   └── Kanban/
│       ├── KanbanBoard.tsx
│       ├── KanbanColumn.tsx
│       └── KanbanCard.tsx
├── store/
│   ├── weekStore.ts
│   ├── taskStore.ts
│   └── uiStore.ts
├── utils/
│   ├── taskParser.ts
│   ├── taskIdentity.ts
│   └── weekUtils.ts
├── types/index.ts
├── App.tsx
└── index.css
```

---

# Planned: Feature A — Cloud KV Sync (no auth)

**Status:** Plan written 2026-04-19. Not yet implemented. Execute with Sonnet.
**Rollback tag to create first:** `pre-cloud-sync`
**Post-success tag:** `v-cloud-sync-done`

## Goal

Make the Vercel-deployed app usable as a personal daily driver: data persists across devices/browsers, survives cache clears, and requires no login. A single shared secret (stored in env vars) gates read/write so the public URL isn't fully open.

**Non-goals:** multi-user auth, real-time sync across simultaneous tabs, offline-first conflict resolution.

## Architecture

```
Browser (Zustand + localStorage)
        │
        │  fetch('/api/sync', { headers: { 'x-sync-secret': VITE_SYNC_SECRET }})
        ▼
Vercel Serverless Function (/api/sync.ts)
        │
        │  @upstash/redis SDK
        ▼
Vercel KV (Upstash Redis, free tier)
   Key: "weeklyflow:snapshot"
   Value: JSON string { pages, projects, ui, updatedAt, version }
```

**Write model:** debounced full-snapshot write (simple, no merge logic). Writes happen 3 seconds after any store change, last-write-wins.
**Read model:** on app startup, fetch snapshot; if server `updatedAt` > local `updatedAt`, hydrate Zustand from server. Otherwise keep local (the user edited offline).
**Conflict policy:** last-write-wins by `updatedAt`. Good enough for a single user across devices. Document this in the work log.

## Prerequisites

- Vercel account (already connected if the app is deployed).
- Upstash account OR enable Vercel KV addon (Upstash under the hood, free tier: 10k commands/day, 256 MB — plenty).
- Generate a random shared secret: `openssl rand -hex 32` → save value, will paste into env vars.

## Step-by-step

### Step 0 — Rollback checkpoint

```bash
cd weeklyflow
git add -A && git commit -m "checkpoint: pre-cloud-sync" || true
git tag pre-cloud-sync
git tag -l  # verify tag exists
```

Record in work-log: "Created tag `pre-cloud-sync` at commit `<hash>`".

### Step 1 — Add dependencies

```bash
cd weeklyflow
npm install @upstash/redis
```

No other deps needed. Vercel's runtime provides `fetch` and the function API.

### Step 2 — Provision KV on Vercel

1. Vercel dashboard → project → **Storage** tab → **Create Database** → choose **KV (Upstash Redis)**.
2. Connect to the project. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` as env vars in production + preview.
3. Manually add one more env var in **Settings → Environment Variables**:
   - Name: `SYNC_SECRET`
   - Value: paste the `openssl rand -hex 32` output
   - Scope: Production + Preview + Development
4. Add to the local `.env.local` (create if missing; already git-ignored via Vite defaults):
   ```
   VITE_SYNC_SECRET=<same value as above>
   ```
   Note: `VITE_` prefix is required for Vite to expose the var to the browser bundle. Yes, this means the secret is in the client bundle — that's acceptable here because:
   - The app is intended only for the owner.
   - The secret is a speed-bump against casual access, not a real auth system.
   - If the user ever deploys this publicly, replace with real auth (Supabase magic link). Note this in the work-log entry.

### Step 3 — Create the serverless function

Create `weeklyflow/api/sync.ts` (Vercel picks up any `api/*.ts` file as a serverless function; no framework config needed):

```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()  // reads KV_REST_API_URL + KV_REST_API_TOKEN
const KEY = 'weeklyflow:snapshot'

export default async function handler(req: Request): Promise<Response> {
  // Auth check
  const secret = req.headers.get('x-sync-secret')
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (req.method === 'GET') {
    const data = await redis.get(KEY)
    return new Response(JSON.stringify({ snapshot: data ?? null }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    // basic shape check
    if (!body || typeof body !== 'object' || !body.updatedAt) {
      return new Response('Bad payload', { status: 400 })
    }
    await redis.set(KEY, body)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = { runtime: 'edge' }
```

**Edge runtime chosen** because: faster cold starts, cheaper per-invocation. If Upstash SDK fails on edge, fall back to `runtime: 'nodejs'`.

### Step 4 — Build the client sync module

Create `weeklyflow/src/sync/cloudSync.ts`:

```typescript
import { useWeekStore } from '../store/weekStore'
import { useProjectStore } from '../store/projectStore'
import { useUIStore } from '../store/uiStore'

const SECRET = import.meta.env.VITE_SYNC_SECRET as string | undefined
const ENDPOINT = '/api/sync'

export interface Snapshot {
  version: 1
  updatedAt: string     // ISO
  pages: Record<string, any>
  projects: Record<string, any>
  ui: any
}

export function isSyncConfigured(): boolean {
  return typeof SECRET === 'string' && SECRET.length > 0
}

export async function pullSnapshot(): Promise<Snapshot | null> {
  if (!isSyncConfigured()) return null
  const res = await fetch(ENDPOINT, { headers: { 'x-sync-secret': SECRET! } })
  if (!res.ok) {
    console.warn('[sync] pull failed:', res.status)
    return null
  }
  const json = await res.json()
  return json.snapshot as Snapshot | null
}

export async function pushSnapshot(snapshot: Snapshot): Promise<boolean> {
  if (!isSyncConfigured()) return false
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sync-secret': SECRET! },
    body: JSON.stringify(snapshot),
  })
  return res.ok
}

export function buildSnapshot(): Snapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: useWeekStore.getState().pages,
    projects: useProjectStore.getState().projects,
    ui: useUIStore.getState(),
  }
}

export function applySnapshot(snapshot: Snapshot) {
  // IMPORTANT: this bypasses Zustand persist's normal write cycle.
  // We set state directly; persist middleware will write to localStorage on next change.
  useWeekStore.setState({ pages: snapshot.pages ?? {} })
  useProjectStore.setState({ projects: snapshot.projects ?? {} })
  if (snapshot.ui) useUIStore.setState(snapshot.ui)
}
```

### Step 5 — Wire pull-on-startup

In `src/App.tsx`, add a `useEffect` on mount (runs once):

```typescript
import { useEffect, useState } from 'react'
import { pullSnapshot, applySnapshot, isSyncConfigured } from './sync/cloudSync'

// Inside App component, after existing hooks:
const [syncState, setSyncState] = useState<'idle' | 'pulling' | 'ready' | 'error'>('idle')

useEffect(() => {
  if (!isSyncConfigured()) { setSyncState('ready'); return }
  setSyncState('pulling')
  pullSnapshot()
    .then(remote => {
      if (!remote) { setSyncState('ready'); return }
      // Compare updatedAt across all local pages — take the max
      const localPages = useWeekStore.getState().pages
      const localMax = Object.values(localPages).reduce(
        (max, p) => (p.updatedAt > max ? p.updatedAt : max),
        ''
      )
      if (remote.updatedAt > localMax) {
        applySnapshot(remote)
      }
      setSyncState('ready')
    })
    .catch(err => {
      console.error('[sync] pull error:', err)
      setSyncState('error')
    })
}, [])
```

Show a small loading state during `pulling` so the editor doesn't mount with empty data then suddenly swap. Block render until `syncState !== 'pulling'`.

### Step 6 — Wire push-on-change (debounced)

Add to `src/sync/cloudSync.ts`:

```typescript
let pushTimer: ReturnType<typeof setTimeout> | null = null

export function schedulePush() {
  if (!isSyncConfigured()) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    const snap = buildSnapshot()
    const ok = await pushSnapshot(snap)
    if (!ok) console.warn('[sync] push failed')
  }, 3000)  // 3s debounce — same order of magnitude as editor autosave
}
```

Subscribe to all three stores in `App.tsx` (after the startup pull resolves):

```typescript
import { useWeekStore } from './store/weekStore'
import { useProjectStore } from './store/projectStore'
import { schedulePush } from './sync/cloudSync'

useEffect(() => {
  if (syncState !== 'ready' || !isSyncConfigured()) return
  const unsubA = useWeekStore.subscribe(schedulePush)
  const unsubB = useProjectStore.subscribe(schedulePush)
  return () => { unsubA(); unsubB() }
}, [syncState])
```

**Do NOT** subscribe `useUIStore` (activeWeekId changes on every click — too noisy). Include UI state in the snapshot but only push when pages/projects change. This is a known tradeoff: if you change active week on desktop and open mobile, mobile won't know. Acceptable.

### Step 7 — Add sync status indicator

In the sidebar footer (next to `Local · no sync`), show:
- `Synced · just now` (within 10s of last push)
- `Synced · 2m ago` (older)
- `Syncing…` (push in flight)
- `Offline` (fetch failed)
- `Local only` (if `isSyncConfigured()` returns false)

Implement as a small `SyncIndicator.tsx` component. Update `Sidebar.tsx` footer to conditionally render it.

### Step 8 — Guard against empty-state overwrites

Critical edge case: user opens the app in a new browser (empty localStorage). The startup pull fetches server snapshot → applies it → good. BUT if the pull fails, the empty local state will debounce-push 3 seconds later and **wipe the server snapshot**.

**Fix:** in `schedulePush`, refuse to push if `syncState === 'error'` OR if the local pages object is empty AND we haven't had a successful pull yet. Track a `hadSuccessfulPull` flag exported from `cloudSync.ts`.

```typescript
let hadSuccessfulPull = false
// ...set to true in pullSnapshot on success

export function schedulePush() {
  if (!isSyncConfigured()) return
  if (!hadSuccessfulPull) {
    console.warn('[sync] skipping push — no successful pull yet')
    return
  }
  // ...rest as before
}
```

### Step 9 — Local dev workflow

- `npm run dev` runs Vite, but `/api/sync` won't exist locally (Vite doesn't run Vercel functions).
- Option A: install `vercel` CLI and run `vercel dev` — runs functions locally.
- Option B: keep dev offline-only; `isSyncConfigured()` returns true but the fetch fails silently → you stay on localStorage. Easiest; recommended.

Document in work-log which option was chosen.

### Step 10 — Test plan

**Before marking done, run these checks in order:**

1. `npm run build` — zero TS errors.
2. Deploy to Vercel preview.
3. Open preview URL in Chrome. Create a week, add tasks. Wait 5s. Check Vercel KV dashboard → `weeklyflow:snapshot` key should exist with your data.
4. Open preview URL in Safari (different browser = empty localStorage). Verify your data appears.
5. Edit a task in Safari. Refresh Chrome. Verify the edit propagates.
6. Open DevTools → Network → block `/api/sync`. Make an edit. Verify the app doesn't crash (error state shown, local edits still save).
7. Unblock, refresh. Verify the queued local edit makes it to the server.

If ANY step fails, do NOT tag `v-cloud-sync-done`. Debug, iterate, re-test.

### Step 11 — Post-success

```bash
git add -A
git commit -m "feat: cloud KV sync with shared-secret auth"
git tag v-cloud-sync-done
```

Append to work-log: date, what worked, what edge cases came up, link to Vercel preview, any known limitations.

## Rollback procedure

If the feature is broken and needs to be reverted:

```bash
cd weeklyflow
git reset --hard pre-cloud-sync
```

Also remove `SYNC_SECRET` env var from Vercel and delete the KV database from the Vercel dashboard to stop any write attempts. Add a work-log entry explaining the rollback reason.

## Known limitations to document

- Single-user only (shared secret is client-visible).
- Last-write-wins; simultaneous edits on two devices can clobber each other.
- No offline queue — if a push fails, it's retried only on the next change.
- Secret rotation requires redeploy + updating `.env.local`.

---

# Planned: Feature B — Week Rollover

**Status:** Plan written 2026-04-19. Not yet implemented. Execute with Sonnet AFTER Feature A is done and tagged.
**Rollback tag to create first:** `pre-rollover`
**Post-success tag:** `v-rollover-done`

## Goal

Let the user create a new week from a previous week, in one of two modes:
1. **Clone full content** — copies the entire Tiptap JSON of the source week into the new week (icon, title skeleton, all paragraphs/tasks/headings). User edits down.
2. **Roll over open tasks only** — creates a fresh week template (standard Mon–Fri skeleton from `createDefaultContent`) and adds an "Unfinished from CW<N>" section at the top listing only unchecked tasks from the source week. Grouped by original day label.

**Non-goals:** moving projects (they're already global — persist across weeks by design), syncing task state between old and new weeks (old week stays frozen as a journal entry).

## User flow

In [NewWeekModal.tsx](weeklyflow/src/components/Sidebar/NewWeekModal.tsx), add a third tab: **"From previous"**. Tab order: `Suggestions | Manual entry | From previous`.

"From previous" tab shows:
- A target week selector (same as Manual: week number + year, defaulting to next non-existent week).
- A source week dropdown (lists all existing weeks, newest first, default = most recent).
- Two radio buttons: `◉ Copy full content` / `○ Roll over open tasks only`.
- A "Create week" button.

## Data flow

```
User picks source + target + mode
  │
  ├── Mode 1 (clone):
  │     new content = deep-clone sourcePage.content
  │     rewrite the H1 "Week N — Goals" line to match target week
  │     reset all task `checked: false`? → NO, keep checked state (user wants same items as starting point)
  │     actually — DO uncheck, since this is a new week (user said "edit later")
  │     → decision: DO uncheck all taskItems on clone
  │
  └── Mode 2 (rollover open):
        new content = createDefaultContent(targetWeek, targetYear)
        openTasks = extractRawTasks(sourcePage.content, sourceId).filter(t => !t.checked)
        group openTasks by dayLabel → build an "Unfinished from CW<N>" section:
          H2 "Unfinished from CW<N>"
          for each day with open tasks:
            paragraph with bold day name
            taskList containing those tasks (unchecked)
        prepend this section after the H1 Goals, before Monday
```

## Step-by-step

### Step 0 — Rollback checkpoint

```bash
cd weeklyflow
git add -A && git commit -m "checkpoint: pre-rollover" || true
git tag pre-rollover
```

### Step 1 — Build the rollover utility

Create `weeklyflow/src/utils/rollover.ts`:

```typescript
import type { JSONContent } from '@tiptap/react'
import type { WeeklyPage } from '../types'
import { extractRawTasks } from './taskParser'
import { createDefaultContent, createWeekPage, getWeekTitle } from './weekUtils'

/** Deep-clone a Tiptap JSON tree and mutate it safely. */
function cloneContent(content: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(content))
}

/** Recursively walk a Tiptap tree and set checked=false on every taskItem. */
function uncheckAll(node: JSONContent) {
  if (node.type === 'taskItem' && node.attrs) {
    node.attrs.checked = false
  }
  if (Array.isArray(node.content)) node.content.forEach(uncheckAll)
}

/** Rewrite the "Week N — Goals" H1 to match the target week number. */
function rewriteGoalsHeading(content: JSONContent, targetWeek: number) {
  const first = content.content?.[0]
  if (first?.type === 'heading' && first.attrs?.level === 1 && first.content) {
    for (const child of first.content) {
      if (child.type === 'text' && typeof child.text === 'string') {
        child.text = child.text.replace(/Week \d+ — Goals/i, `Week ${targetWeek} — Goals`)
      }
    }
  }
}

/** MODE 1: clone source content into a new page, unchecking all tasks. */
export function cloneWeek(
  source: WeeklyPage,
  targetWeek: number,
  targetYear: number
): WeeklyPage {
  const cloned = cloneContent(source.content)
  uncheckAll(cloned)
  rewriteGoalsHeading(cloned, targetWeek)
  const id = `CW${targetWeek}-${targetYear}`
  return {
    id,
    weekNumber: targetWeek,
    year: targetYear,
    icon: source.icon,
    title: getWeekTitle(targetWeek, targetYear),
    content: cloned,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/** MODE 2: fresh template + "Unfinished from CW<N>" section with open tasks. */
export function rolloverOpenTasks(
  source: WeeklyPage,
  targetWeek: number,
  targetYear: number
): WeeklyPage {
  const base = createWeekPage(targetWeek, targetYear)
  const open = extractRawTasks(source.content, source.id).filter(t => !t.checked)

  if (open.length === 0) return base  // nothing to roll over; return plain template

  // Group by dayLabel preserving original order (Mon..Fri..General)
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'General']
  const grouped: Record<string, string[]> = {}
  for (const t of open) {
    if (!grouped[t.dayLabel]) grouped[t.dayLabel] = []
    grouped[t.dayLabel].push(t.title)
  }

  // Build the carry-over section
  const carrySection: JSONContent[] = [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: `Unfinished from CW${source.weekNumber}` }],
    },
  ]

  for (const day of dayOrder) {
    const titles = grouped[day]
    if (!titles || titles.length === 0) continue
    carrySection.push({
      type: 'paragraph',
      content: [{ type: 'text', text: day, marks: [{ type: 'bold' }] }],
    })
    carrySection.push({
      type: 'taskList',
      content: titles.map(title => ({
        type: 'taskItem',
        attrs: { checked: false },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: title }] }],
      })),
    })
  }

  // Insert carry section after the H1 (index 0) + trailing paragraph (index 1)
  const baseContent = base.content.content ?? []
  const newContent = [
    ...baseContent.slice(0, 2),   // H1 + paragraph
    ...carrySection,
    ...baseContent.slice(2),       // Monday onward
  ]

  return {
    ...base,
    content: { type: 'doc', content: newContent },
  }
}
```

### Step 2 — Extend `NewWeekModal`

Open [NewWeekModal.tsx](weeklyflow/src/components/Sidebar/NewWeekModal.tsx).

Changes:
1. Add `'from-previous'` to the `tab` state union: `'pick' | 'manual' | 'from-previous'`.
2. Add a third tab button in the tab row (match existing style).
3. Add state for source selection + mode:
   ```typescript
   const [sourceId, setSourceId] = useState<string>('')
   const [rolloverMode, setRolloverMode] = useState<'clone' | 'open'>('clone')
   const [fromWeek, setFromWeek] = useState('')
   const [fromYear, setFromYear] = useState(String(getCurrentYear()))
   ```
4. When tab becomes `'from-previous'`, default `sourceId` to the most recent existing page (sort `Object.values(pages)` by `updatedAt` desc).
5. Render tab content: source dropdown, target week number/year inputs, two radio buttons for mode.
6. Add a `handleFromPreviousSubmit` function:
   ```typescript
   function handleFromPreviousSubmit() {
     const wn = parseInt(fromWeek, 10)
     const yr = parseInt(fromYear, 10)
     if (!sourceId || !pages[sourceId]) { setError('Pick a source week'); return }
     if (isNaN(wn) || wn < 1 || wn > 53) { setError('Week number 1–53'); return }
     if (isNaN(yr) || yr < 2020 || yr > 2099) { setError('Invalid year'); return }
     const targetId = `CW${wn}-${yr}`
     if (pages[targetId]) { setError('That week already exists'); return }
     const source = pages[sourceId]
     const page = rolloverMode === 'clone'
       ? cloneWeek(source, wn, yr)
       : rolloverOpenTasks(source, wn, yr)
     addPage(page)
     setActiveWeekId(page.id)
     onClose()
   }
   ```
7. Update the footer: show "Create week" button when `tab === 'from-previous'` too (currently only for `'manual'`).

### Step 3 — Decide on "checked state on clone"

**Decision:** clone mode **does uncheck** all tasks. Rationale: the user wants a starting template for editing; carrying over checked state would be misleading (tasks weren't actually done *this* week).

Documented in the rollover utility via `uncheckAll`. If the user wants a "true copy with checks preserved" later, add a checkbox in the modal.

### Step 4 — Smoke-test checklist

After implementation, manually verify in browser:

1. **Clone mode, normal week:** source = CW14 with 5 tasks (3 checked). Target = CW20. Result: CW20 exists with all 5 tasks unchecked, same headings, H1 says "Week 20 — Goals". ✓
2. **Rollover-open mode, some open tasks:** source = CW14 with 5 tasks (3 checked). Target = CW20. Result: CW20 has standard Mon–Fri template + "Unfinished from CW14" section listing exactly the 2 unchecked tasks, grouped by their original day. ✓
3. **Rollover-open mode, zero open tasks:** source = CW14 all checked. Target = CW20. Result: CW20 is the plain default template; no "Unfinished" section. ✓
4. **Target collision:** pick a target week that already exists → error shown, no overwrite. ✓
5. **Kanban sync:** open new CW20, verify Kanban shows the rolled-over tasks in "To Do" column. ✓
6. **Projects untouched:** verify the global projects board is unchanged after rollover. ✓
7. **Edit old week:** check off a task in the *source* week CW14 → verify the new CW20 "Unfinished" section does NOT update (old week is frozen journal). ✓

### Step 5 — Edge cases to handle

- Source has malformed content (no H1, no day headings): cloneWeek still works (deep-clones whatever's there). rolloverOpenTasks falls back to default template + carry section.
- Source task title is empty string → `extractRawTasks` already filters these. OK.
- Bolded/italic text in task titles: `extractRawTasks` returns plain text only (via `getTextContent`). Rolled-over tasks lose formatting. Document as a known limitation; improve later.
- Very long unfinished sections (50+ tasks): renders fine in Tiptap. No change needed.

### Step 6 — Post-success

```bash
git add -A
git commit -m "feat: week rollover (clone + open-tasks modes)"
git tag v-rollover-done
```

Append to work-log: what shipped, any edge cases discovered, whether both modes landed or only one.

## Rollback procedure

```bash
cd weeklyflow
git reset --hard pre-rollover
```

Add a work-log entry with the reason.

## Future extensions (do NOT build now)

- A "🔄 Roll over" button on a week page itself (outside the modal) for one-click next-week creation.
- Carry-over badge on Kanban cards showing "Rolled over from CW14".
- Smart default for target week = source week + 1.
- Preserve task formatting (bold, links) when rolling over — requires deep-cloning `taskItem` content instead of reconstructing from plain text.

---

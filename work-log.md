# WeeklyFlow — Work Log

---

## Build History (Phases 1–9, Apr 6 – Apr 25, 2026)

All phases complete. App is fully functional locally at `localhost:5173`.

| Phase | What was built |
|-------|---------------|
| 1 | Vite + React + TS scaffold, all deps, Tailwind v4, Google Fonts |
| 2 | AppLayout, Sidebar, WeekList, ViewSwitcher (⌘K toggle) |
| 3 | Tiptap editor, custom checkboxes, BubbleMenu, emoji icon, auto-save |
| 4 | taskParser (walks Tiptap JSON), taskIdentity (hash IDs), taskStore |
| 5 | KanbanBoard 3-column DnD (@dnd-kit), KanbanCard, KanbanColumn |
| 6 | Two-way sync editor↔Kanban, loop prevention via isExternalUpdate ref |
| 7 | ⌘K shortcut, smooth fade transition, "now" badge, empty state |
| 8 | Projects Kanban tab — projectStore, ProjectCard, ProjectTaskRow, KanbanTabs, EmptyProjectsState, ArchivedProjectsView |
| 9A | Project auto-completion + archive — status field, completedAt/archivedAt, store migration v2, "✓ Completed" badge, Archive/Delete menu |
| 9B | "Open Nw" / completion date counter on project cards (date-fns) |
| 9C | Cross-week task continuity — tasks persisted (weeklyflow:tasks), reconcileTasks() walks all pages, stable nanoid IDs, global Kanban, carry-over badge, "This week" filter chip |

**Rollback tags:** `pre-sidebar-rebrand`, `pre-cloud-sync`

---

## Current State

- **localStorage keys:** `weeklyflow:pages`, `weeklyflow:ui`, `weeklyflow:projects`, `weeklyflow:tasks`
- **taskStore** is now persisted (Option 2 chosen for 9C). Tasks have stable nanoid IDs, `originWeekId`, `occurrences[]`.
- `taskParser.ts` is now a pure extractor (`extractRawTasks`). Reconciliation is in `taskStore.reconcileTasks(pages)`.
- Kanban is global by default; "This week" chip filters to active week's tasks.
- Projects auto-complete when all subtasks done; archive view available.

---

## Next: Feature A — Cloud KV Sync

**Goal:** Persist data to Vercel KV (Upstash Redis) behind a shared-secret header so the app works across devices/browsers. No auth — single shared secret in an env var.

**Plan:**
1. Create `api/sync.ts` Vercel serverless function — accepts `GET` (pull all keys) and `POST` (push a key/value). Protected by `Authorization: Bearer <SYNC_SECRET>` header.
2. Add `VITE_SYNC_SECRET` + `VITE_KV_URL` to `.env.local` and Vercel env vars.
3. Create `src/utils/kvSync.ts` — thin wrapper: `pushKey(key, value)`, `pullKey(key)`, `pullAll()`.
4. In each Zustand store (`weekStore`, `taskStore`, `projectStore`, `uiStore`), add a `syncToKV()` action and a `loadFromKV()` action.
5. On app boot (`App.tsx`): call `loadFromKV()` for all stores; merge strategy = KV wins if newer `updatedAt`, else keep local.
6. On every store write: debounced `pushKey()` (500ms, same pattern as editor save).
7. Add a subtle sync status indicator in the sidebar footer (●synced / ●syncing / ●offline).

**Rollback tag to create before starting:** `pre-cloud-sync` *(already exists)*

---

## Next: Feature B — Week Rollover

**Goal:** "New week from previous" option in NewWeekModal — clone full content OR roll over only unchecked tasks.

**Plan:**
1. Add a "From previous week" tab in `NewWeekModal.tsx`.
2. Two modes: **Clone** (copy full Tiptap JSON), **Roll over** (walk JSON, keep only unchecked taskItems, reset checked ones).
3. After creation, run `reconcileTasks(pages)` so carry-over tasks get their `occurrences` updated immediately.

**Rollback tag:** `pre-rollover`

---

## Git / Version Control Setup (Apr 25, 2026)

- Git repo lives inside `weeklyflow/` subfolder (not Thinking-System root).
- Remote: `https://github.com/mexiro/weekly-flow.git` (not yet pushed).
- Current branch: `feat/revamped-sidebar`. `main` branch = older working Vercel version.
- Decision: test locally first before pushing or merging to main.
- Future: consider extracting `weeklyflow/` as its own standalone repo.

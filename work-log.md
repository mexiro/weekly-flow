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
| 10A | Feature A complete — Cloud KV sync (Vercel edge fn + Upstash Redis, x-sync-secret header, debounced 3s push, pull-on-boot merge) |
| 10B | Feature B — Week rollover from previous week (Clone / Roll-over modes) in NewWeekModal |
| 10C | Rollover UX polish: carried tasks land in "📥 Unassigned" group (not in days). Kanban card shows `originWeekId` instead of latest weekId. New "↻ Carried over" filter chip on Kanban. Carry-over label updated to `↻ from CWxx · Nw open` |

**Rollback tags:** `pre-sidebar-rebrand`, `pre-cloud-sync`, `pre-rollover`, `v-rollover-done`

---

## Current State

- **localStorage keys:** `weeklyflow:pages`, `weeklyflow:ui`, `weeklyflow:projects`, `weeklyflow:tasks`
- **taskStore** is now persisted (Option 2 chosen for 9C). Tasks have stable nanoid IDs, `originWeekId`, `occurrences[]`.
- `taskParser.ts` is now a pure extractor (`extractRawTasks`). Reconciliation is in `taskStore.reconcileTasks(pages)`.
- Kanban is global by default; "This week" chip filters to active week's tasks.
- Projects auto-complete when all subtasks done; archive view available.

---

## Phase 10 Details (Apr 25, 2026)

**10A — Cloud KV sync (Feature A, complete):**
- `api/sync.ts` — Vercel edge function, Upstash Redis (`@upstash/redis`), `x-sync-secret` header. GET returns snapshot, POST writes it.
- `src/sync/cloudSync.ts` — `pullSnapshot`, `pushSnapshot`, `buildSnapshot`, `applySnapshot`, `schedulePush` (debounced 3s, blocked until first successful pull). Custom window events: `sync:push-start/done/fail`.
- `App.tsx` — pulls on boot, applies snapshot if `remote.updatedAt > localMax`, subscribes weekStore + projectStore to trigger `schedulePush`.
- `SidebarFooter` includes a `SyncIndicator` showing ●synced / ●syncing / ●offline.

**10B — Week rollover (Feature B, complete):**
- Third tab "From previous" in `NewWeekModal.tsx` — source-week dropdown + Roll over / Clone radio.
- `rolloverContent(source, mode, weekNumber, year)` in `weekUtils.ts` — collects taskItems from source (unchecked only for rollover), wraps them under a "📥 Unassigned" heading + taskList, ABOVE the standard Mon–Fri skeleton.
- After creation, calls `reconcileTasks(pages)` so carry-over tasks get their `occurrences[]` updated.

**10C — Rollover UX polish:**
- Carried tasks no longer land in day buckets — they go into "📥 Unassigned" so user explicitly assigns them to a day.
- `taskParser.ts` recognizes "Unassigned" as a valid grouping label (returns `dayLabel: 'Unassigned'`).
- `KanbanCard.tsx` now shows `task.originWeekId` (e.g., CW15) instead of `task.weekId` (latest) — the truth is where the task was created.
- `KanbanBoard.tsx` filter chips: replaced two-state "All / This week" with three-state `filterMode: 'all' | 'thisWeek' | 'carryover'`. New chip "↻ Carried over" filters to tasks with `occurrences.length > 1`.
- Carry-over label format updated: `↻ from CW15 · 3w open` (always shows when multi-occurrence, even if <1 week old).

---

## Git / Version Control Setup (Apr 25, 2026)

- Git repo lives inside `weeklyflow/` subfolder (not Thinking-System root).
- Remote: `https://github.com/mexiro/weekly-flow.git` (not yet pushed).
- Current branch: `feat/revamped-sidebar`. `main` branch = older working Vercel version.
- Decision: test locally first before pushing or merging to main.
- Future: consider extracting `weeklyflow/` as its own standalone repo.

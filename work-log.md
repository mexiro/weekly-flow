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

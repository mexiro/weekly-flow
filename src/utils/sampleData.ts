import type { JSONContent } from '@tiptap/react'
import { getISOWeek, getISOWeekYear, addWeeks, startOfISOWeek, format, endOfISOWeek } from 'date-fns'
import { useWeekStore } from '../store/weekStore'
import { useTaskStore } from '../store/taskStore'
import { useProjectStore } from '../store/projectStore'
import { useUIStore } from '../store/uiStore'
import { nanoid } from './taskIdentity'
import type { Project } from '../types'

// ─── Tiptap node helpers ──────────────────────────────────────────

function heading(level: 1 | 2, text: string): JSONContent {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }
}

function paragraph(text: string): JSONContent {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }
}

function taskList(items: Array<{ text: string; checked: boolean }>): JSONContent {
  return {
    type: 'taskList',
    content: items.map(item => ({
      type: 'taskItem',
      attrs: { checked: item.checked },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item.text }] }],
    })),
  }
}

// ─── Week page builders ───────────────────────────────────────────

function makeWeekId(weekNumber: number, year: number): string {
  return `CW${weekNumber}-${year}`
}

function makeWeekTitle(weekNumber: number, year: number): string {
  const jan4 = new Date(year, 0, 4)
  const weekStart = addWeeks(startOfISOWeek(jan4), weekNumber - 1)
  const weekEnd = endOfISOWeek(weekStart)
  return `Week ${weekNumber} · ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`
}

function buildWeekContent(
  weekNumber: number,
  goal: string,
  days: Array<{
    name: string
    tasks: Array<{ text: string; checked: boolean }>
    note?: string
  }>
): JSONContent {
  const nodes: JSONContent[] = [
    heading(1, `🏦 Week ${weekNumber} — Goals`),
    paragraph(goal),
  ]
  for (const day of days) {
    nodes.push(heading(2, day.name))
    if (day.note) nodes.push(paragraph(day.note))
    nodes.push(taskList(day.tasks))
  }
  return { type: 'doc', content: nodes }
}

// ─── Fictional finance company context ───────────────────────────
//
// Company: Ardent Capital — a mid-size asset management firm
// Team: Finance Operations (FinOps) — owns reconciliation, reporting,
//       regulatory compliance, and internal tooling
//
// Cast (all fictional, no real people):
//   — no names used anywhere in task text, just role references

// ─── Last week: Q1 close sprint (fully done except one carry-over) ─

const LAST_WEEK_DAYS = [
  {
    name: 'Monday',
    tasks: [
      { text: 'Reconcile Q1 ledger entries across all fund accounts', checked: true },
      { text: 'Pull NAV discrepancy report — identify top 5 gaps', checked: true },
      { text: 'Confirm cut-off dates with custody team', checked: true },
      { text: 'Distribute Q1 close checklist to ops analysts', checked: true },
    ],
    note: 'Q1 close sprint begins. Tight deadline — March 31 figures due Friday EOD.',
  },
  {
    name: 'Tuesday',
    tasks: [
      { text: 'Review FX revaluation run — flag anomalies above 0.5%', checked: true },
      { text: 'Sync with fund accounting on accrual adjustments', checked: true },
      { text: 'Draft data quality memo for senior management', checked: true },
      { text: 'Validate Bloomberg feed against internal pricing model', checked: true },
    ],
  },
  {
    name: 'Wednesday',
    tasks: [
      { text: 'Stress-test liquidity ratios for three flagship funds', checked: true },
      { text: 'Prepare EMIR trade reporting batch — submit to regulator', checked: true },
      { text: 'Cross-check counterparty exposure limits vs current positions', checked: true },
      { text: 'Review draft MiFID II transaction reports before midnight cutoff', checked: true },
    ],
    note: 'EMIR submission window closes at 18:00 CET — no slippage allowed.',
  },
  {
    name: 'Thursday',
    tasks: [
      { text: 'Run month-end P&L attribution across equity and fixed-income sleeves', checked: true },
      { text: 'Reconcile broker statements — three custodians pending', checked: true },
      { text: 'Prepare board pack slides: performance vs benchmark', checked: true },
      { text: 'Internal audit liaison — send Q1 evidence pack', checked: false },
    ],
    note: 'Audit pack deferred — awaiting sign-off from compliance.',
  },
  {
    name: 'Friday',
    tasks: [
      { text: 'Submit Q1 financial statements to fund administrator', checked: true },
      { text: 'Distribute investor report drafts for review', checked: true },
      { text: 'Post-close retro — document 3 process improvements', checked: true },
      { text: 'Update risk register with Q1 findings', checked: true },
    ],
    note: 'Q1 close delivered on time. Audit pack carries to next week.',
  },
]

// ─── Current week: regulatory sprint + product launch prep ─────────

const CURRENT_WEEK_DAYS = [
  {
    name: 'Monday',
    tasks: [
      { text: 'Internal audit liaison — send Q1 evidence pack (carry-over)', checked: true },
      { text: 'Kick off SFDR Article 8 disclosure review for new fund', checked: true },
      { text: 'Align with legal on updated KYC policy rollout timeline', checked: false },
    ],
    note: 'Clearing the Q1 carry-over first. SFDR review is the big new item this week.',
  },
  {
    name: 'Tuesday',
    tasks: [
      { text: 'Model cash flow projections — 3 scenarios for infrastructure fund', checked: false },
      { text: 'Review draft prospectus — flag valuation methodology section', checked: false },
      { text: 'Reconcile T+2 settlement fails from last week', checked: false },
    ],
  },
  {
    name: 'Wednesday',
    tasks: [
      { text: 'ESG data gap analysis — prepare remediation plan', checked: false },
      { text: 'Stress scenario: 200bps rate shock on duration book', checked: false },
      { text: 'Update collateral management dashboard with latest haircuts', checked: false },
    ],
  },
  {
    name: 'Thursday',
    tasks: [
      { text: 'Regulatory capital calculation — CET1 ratio for monthly report', checked: false },
      { text: 'Review counterparty credit scoring model — quarterly refresh', checked: false },
      { text: 'Prepare liquidity coverage ratio (LCR) submission', checked: false },
    ],
  },
  {
    name: 'Friday',
    tasks: [
      { text: 'Finalise SFDR Article 8 disclosure draft — send to legal', checked: false },
      { text: 'Weekly ops review — flag any open settlements above EUR 5M', checked: false },
      { text: 'Retrospective: 3 things to improve in ops workflow', checked: false },
    ],
  },
]

// ─── Next week: quarterly planning + new product pipeline ──────────

const NEXT_WEEK_DAYS = [
  {
    name: 'Monday',
    tasks: [
      { text: 'Q2 planning kick-off — set OKRs for FinOps team', checked: false },
      { text: 'Review vendor proposals for new reconciliation platform', checked: false },
    ],
  },
  {
    name: 'Tuesday',
    tasks: [
      { text: 'Fee calculation audit — fixed vs performance fees across mandates', checked: false },
      { text: 'Roadmap alignment with technology team', checked: false },
    ],
  },
  {
    name: 'Wednesday',
    tasks: [
      { text: 'Draft SLA framework for new fund administrator', checked: false },
    ],
  },
  {
    name: 'Thursday',
    tasks: [
      { text: 'Benchmark ops costs vs peer firms — present findings to CFO', checked: false },
    ],
  },
  {
    name: 'Friday',
    tasks: [
      { text: 'Wrap Q2 planning document — circulate for sign-off', checked: false },
      { text: 'Month-start checklist — confirm all standing instructions', checked: false },
    ],
  },
]

// ─── Fictional projects ───────────────────────────────────────────

function makeSampleProjects(): Project[] {
  const now = new Date().toISOString()
  return [
    {
      id: nanoid(),
      title: 'Recon Platform Migration',
      assignee: 'FinOps',
      tasks: [
        { id: nanoid(), text: 'Complete RFP evaluation — shortlist 2 vendors', done: true },
        { id: nanoid(), text: 'Conduct technical due diligence workshops', done: true },
        { id: nanoid(), text: 'Negotiate commercial terms and SLA', done: false },
        { id: nanoid(), text: 'Parallel-run: new vs legacy for 4 weeks', done: false },
        { id: nanoid(), text: 'Cut-over and decommission legacy system', done: false },
      ],
      createdAt: now,
      updatedAt: now,
      status: 'active',
    },
    {
      id: nanoid(),
      title: 'SFDR Article 8 Launch',
      assignee: 'Compliance',
      tasks: [
        { id: nanoid(), text: 'Gap analysis against Article 8 criteria', done: true },
        { id: nanoid(), text: 'Source ESG data feeds (MSCI + Sustainalytics)', done: true },
        { id: nanoid(), text: 'Draft pre-contractual disclosure documents', done: false },
        { id: nanoid(), text: 'Legal review of disclosure language', done: false },
        { id: nanoid(), text: 'Publish on fund factsheet and website', done: false },
      ],
      createdAt: now,
      updatedAt: now,
      status: 'active',
    },
    {
      id: nanoid(),
      title: 'LCR Reporting Automation',
      tasks: [
        { id: nanoid(), text: 'Map current manual LCR calculation steps', done: true },
        { id: nanoid(), text: 'Define data inputs and transformation rules', done: false },
        { id: nanoid(), text: 'Build Python script for automated run', done: false },
        { id: nanoid(), text: 'UAT with treasury team', done: false },
      ],
      createdAt: now,
      updatedAt: now,
      status: 'active',
    },
  ]
}

// ─── Public API ───────────────────────────────────────────────────

export function seedSampleData() {
  const now = new Date()
  const currentWN   = getISOWeek(now)
  const currentYear = getISOWeekYear(now)

  const lastWN   = currentWN - 1 > 0 ? currentWN - 1 : 52
  const lastYear = currentWN - 1 > 0 ? currentYear : currentYear - 1
  const nextWN   = currentWN + 1 <= 52 ? currentWN + 1 : 1
  const nextYear = currentWN + 1 <= 52 ? currentYear : currentYear + 1

  const weeks = [
    {
      wn: lastWN, yr: lastYear, icon: '✅',
      goal: 'Q1 close — reconcile all accounts, submit regulatory filings, deliver investor reports on time.',
      days: LAST_WEEK_DAYS,
    },
    {
      wn: currentWN, yr: currentYear, icon: '🏦',
      goal: 'Clear Q1 carry-overs, drive SFDR Article 8 review, and keep regulatory submissions on track.',
      days: CURRENT_WEEK_DAYS,
    },
    {
      wn: nextWN, yr: nextYear, icon: '📊',
      goal: 'Q2 planning kick-off, vendor selection for recon platform, and new fund pipeline prep.',
      days: NEXT_WEEK_DAYS,
    },
  ]

  const { addPage, pages } = useWeekStore.getState()

  for (const { wn, yr, icon, goal, days } of weeks) {
    const id = makeWeekId(wn, yr)
    if (pages[id]) continue
    addPage({
      id,
      weekNumber: wn,
      year: yr,
      icon,
      title: makeWeekTitle(wn, yr),
      content: buildWeekContent(wn, goal, days),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const currentId = makeWeekId(currentWN, currentYear)
  useUIStore.getState().setActiveWeekId(currentId)

  const allPages = useWeekStore.getState().pages
  useTaskStore.getState().reconcileTasks(allPages)

  const { projects } = useProjectStore.getState()
  if (Object.keys(projects).length === 0) {
    for (const proj of makeSampleProjects()) {
      const created = useProjectStore.getState().addProject(proj.title)
      if (proj.assignee) {
        useProjectStore.getState().updateProjectAssignee(created.id, proj.assignee)
      }
      for (const t of proj.tasks) {
        useProjectStore.getState().addTask(created.id, t.text)
        if (t.done) {
          const taskId = useProjectStore.getState().projects[created.id]
            .tasks.find(pt => pt.text === t.text)?.id
          if (taskId) useProjectStore.getState().toggleTask(created.id, taskId)
        }
      }
    }
  }
}

export function clearAllData() {
  useWeekStore.setState({ pages: {} })
  useTaskStore.setState({ tasks: [] })
  useProjectStore.setState({ projects: {} })
  useUIStore.setState({ activeWeekId: null, activeView: 'editor' })
  localStorage.removeItem('weeklyflow:pages')
  localStorage.removeItem('weeklyflow:tasks')
  localStorage.removeItem('weeklyflow:projects')
  localStorage.removeItem('weeklyflow:ui')
}

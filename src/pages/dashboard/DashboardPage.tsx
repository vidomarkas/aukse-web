import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import SpendingTimeline from "../../components/dashboard/SpendingTimeline"
import NeedsAttention from "../../components/dashboard/NeedsAttention"
import BudgetsSection from "../../components/dashboard/BudgetsSection"
import WhatChanged from "../../components/dashboard/WhatChanged"
import SixMonths from "../../components/dashboard/SixMonths"
import { useHouseholds, useActiveHouseholdData } from "../../hooks/useHousehold"
import { useBudgets } from "../../hooks/useBudgets"
import { useCategories } from "../../hooks/useCategories"
import {
  useAttention,
  useCategoryChanges,
  useCurrentMonthStats,
  useMonthlySpending,
  useSpendingByCategory,
  useSpendingTimeline,
} from "../../hooks/useTransactions"
import { budgetRows, monthElapsed } from "../../lib/budgets"
import { daysLeftInMonth, monthName, shiftMonth, toMonthKey } from "../../lib/format"

const CURRENCY = "EUR"

function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const current = toMonthKey()
  const isCurrent = month === current
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-line rounded-full p-1">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-cream hover:text-ink transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="px-2 min-w-[9.5rem] text-center text-sm font-medium text-ink tabular-nums">
        {monthName(month, { month: "long", year: "numeric" })}
      </span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-cream hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
      {!isCurrent && (
        <button
          onClick={() => onChange(current)}
          className="ml-1 bg-ink text-white rounded-full px-4 h-9 text-sm font-medium hover:bg-ink-soft transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { isLoading } = useHouseholds()
  const household = useActiveHouseholdData()
  const [month, setMonth] = useState(toMonthKey)

  const { data: stats } = useCurrentMonthStats(household?.id, month)
  const { data: spending = [] } = useSpendingByCategory(household?.id, month)
  const { data: trend = [] } = useMonthlySpending(household?.id, month)
  const { data: timeline } = useSpendingTimeline(household?.id, month)
  const { data: changes } = useCategoryChanges(household?.id, month)
  const { data: attention } = useAttention(household?.id, month)
  const budgetsQuery = useBudgets(household?.id)
  const budgets = budgetsQuery.data ?? []
  const { data: categories = [] } = useCategories(household?.id)

  if (isLoading) return <Layout><p className="text-stone">Loading…</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  const isCurrentMonth = month === toMonthKey()
  const elapsed = monthElapsed(month)
  const rows = budgetRows(budgets, categories, spending, stats?.spent ?? 0, month)

  return (
    <Layout>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-stone mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            {household.name}
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
            {monthName(month)},{" "}
            <em className="not-italic text-gold">{isCurrentMonth ? "together." : monthName(month, { year: "numeric" }) + "."}</em>
          </h1>
        </div>
        <MonthSwitcher month={month} onChange={setMonth} />
      </header>

      <SpendingTimeline data={timeline} month={month} currency={CURRENCY} />

      <NeedsAttention attention={attention} budgets={rows} daysLeft={daysLeftInMonth(month)} currency={CURRENCY} />

      <BudgetsSection
        rows={rows}
        elapsed={elapsed}
        status={budgetsQuery.isError && !budgetsQuery.data ? "error" : budgetsQuery.isPending ? "loading" : "ready"}
        onRetry={() => budgetsQuery.refetch()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WhatChanged data={changes} month={month} currency={CURRENCY} />
        <SixMonths data={trend} selected={month} currency={CURRENCY} onSelect={setMonth} />
      </div>
    </Layout>
  )
}

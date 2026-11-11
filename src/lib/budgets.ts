import type { Budget, Category } from "../types"
import type { CategorySpending } from "../hooks/useTransactions"
import { toMonthKey } from "./format"

export type BudgetRow = {
  id: string
  name: string
  icon?: string | null
  spent: number
  limit: number
  currency: string
  /** Share of the limit used, 0–∞ (1 = exactly on budget). */
  used: number
  /** The budget without a category: a limit on the month's total spending. */
  isTotal: boolean
  status: "ok" | "ahead" | "over"
}

/**
 * How far through the month we are, 0–1. The "today" marker: if spending were spread evenly,
 * this is the share of each budget that would be used by now. Null for past and future months.
 */
export function monthElapsed(month: string, today = new Date()): number | null {
  if (month !== toMonthKey(today)) return null
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return today.getDate() / daysInMonth
}

function monthBounds(month: string) {
  const [year, m] = month.split("-").map(Number)
  return { start: new Date(Date.UTC(year, m - 1, 1)), end: new Date(Date.UTC(year, m, 1)) }
}

/**
 * Monthly budgets active in `month`, with spending for that month. Spending comes from the month's
 * category totals rather than the budget's own figure, so past months show correctly too.
 */
export function budgetRows(
  budgets: Budget[],
  categories: Category[],
  spending: CategorySpending[],
  monthTotal: number,
  month: string,
): BudgetRow[] {
  const { start, end } = monthBounds(month)
  const elapsed = monthElapsed(month)

  return budgets
    .filter((b) => b.period === "monthly")
    .filter((b) => new Date(b.startDate) < end && (!b.endDate || new Date(b.endDate) >= start))
    .map((b) => {
      const category = categories.find((c) => c.id === b.categoryId)
      const isTotal = !b.categoryId
      const spent = isTotal ? monthTotal : spending.find((s) => s.categoryId === b.categoryId)?.value ?? 0
      const limit = Number(b.amount)
      const used = limit > 0 ? spent / limit : 0
      // "Ahead": more than 10 points past where even spending would be by today, and at least half used.
      const status: BudgetRow["status"] =
        used > 1 ? "over" : elapsed !== null && used >= 0.5 && used > elapsed + 0.1 ? "ahead" : "ok"
      return {
        id: b.id,
        name: isTotal ? "Monthly total" : category?.name ?? "Category",
        icon: category?.icon,
        spent,
        limit,
        currency: b.currency,
        used,
        isTotal,
        status,
      }
    })
    .sort((a, b) => Number(a.isTotal) - Number(b.isTotal) || b.used - a.used)
}

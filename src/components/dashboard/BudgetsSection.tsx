import { Link } from "react-router-dom"
import type { BudgetRow } from "../../lib/budgets"
import { formatMoney } from "../../lib/format"
import DashboardCard from "./DashboardCard"

const FILL: Record<BudgetRow["status"], string> = {
  ok: "bg-gold",
  ahead: "bg-[#e0892f]",
  over: "bg-[#d85a30]",
}

function BudgetBar({ row, elapsed }: { row: BudgetRow; elapsed: number | null }) {
  const left = row.limit - row.spent
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_9rem] items-center gap-x-4 gap-y-1 py-2.5">
      <span className="text-sm font-medium text-ink truncate">
        {row.icon && <span className="mr-1.5">{row.icon}</span>}
        {row.name}
      </span>
      <div className="relative h-2.5 rounded-full bg-[#ece9e2]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ${FILL[row.status]}`}
          style={{ width: `${Math.min(row.used, 1) * 100}%` }}
        />
        {elapsed !== null && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink"
            style={{ left: `${elapsed * 100}%` }}
            title="Where you'd be today if spending evenly"
          />
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold font-display tabular-nums text-ink">
          {formatMoney(row.spent, row.currency, { whole: true })}
          <span className="text-stone font-medium"> / {formatMoney(row.limit, row.currency, { whole: true })}</span>
        </p>
        <p className={`text-xs tabular-nums ${row.status === "over" ? "text-[#b54a22]" : "text-stone"}`}>
          {left >= 0 ? `${formatMoney(left, row.currency, { whole: true })} left` : `${formatMoney(-left, row.currency, { whole: true })} over`}
        </p>
      </div>
    </div>
  )
}

/** Each monthly budget's progress, with a "today" marker showing the even-spending pace. */
export default function BudgetsSection({
  rows,
  elapsed,
  status,
  onRetry,
}: {
  rows: BudgetRow[]
  elapsed: number | null
  /** Loading and errors must not look like "no budgets". */
  status: "loading" | "error" | "ready"
  onRetry: () => void
}) {
  const categoryRows = rows.filter((r) => !r.isTotal)
  const totalRows = rows.filter((r) => r.isTotal)

  return (
    <DashboardCard
      label="The plan for the month"
      title="Budgets"
      action={
        <Link to="/budgets" className="text-sm font-medium text-stone hover:text-ink transition-colors">
          Manage →
        </Link>
      }
      className="mb-4"
    >
      {status === "loading" ? (
        <div className="space-y-4 py-2" aria-label="Loading budgets">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2.5 rounded-full bg-[#ece9e2] animate-pulse" />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-coral-soft/50 rounded-2xl p-5">
          <p className="text-sm text-[#712b13]">Couldn't load your budgets.</p>
          <button onClick={onRetry} className="shrink-0 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors">
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream rounded-2xl p-5">
          <p className="text-sm text-stone">
            No monthly budgets yet. Set limits per category and you'll see here how fast each one is filling up.
          </p>
          <Link to="/budgets" className="shrink-0 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors">
            Set a budget
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line">
            {categoryRows.map((row) => (
              <BudgetBar key={row.id} row={row} elapsed={elapsed} />
            ))}
          </div>
          {totalRows.length > 0 && (
            <div className={categoryRows.length ? "mt-2 pt-2 border-t-2 border-line" : ""}>
              {totalRows.map((row) => (
                <BudgetBar key={row.id} row={row} elapsed={elapsed} />
              ))}
            </div>
          )}
          {elapsed !== null && (
            <p className="flex items-center gap-2 text-xs text-stone mt-3">
              <span className="inline-block w-0.5 h-3 rounded-full bg-ink" />
              Where you'd be today if spending evenly through the month. Past the marker means spending faster than planned.
            </p>
          )}
        </>
      )}
    </DashboardCard>
  )
}

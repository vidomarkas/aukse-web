import { Link } from "react-router-dom"
import { Bell } from "lucide-react"
import type { Attention } from "../../hooks/useTransactions"
import type { BudgetRow } from "../../lib/budgets"
import { formatMoney } from "../../lib/format"

/** A slim strip of things to act on. Renders nothing when there's nothing to do. */
export default function NeedsAttention({
  attention,
  budgets,
  daysLeft,
  currency,
}: {
  attention?: Attention
  budgets: BudgetRow[]
  daysLeft: number
  currency: string
}) {
  const uncategorized = attention?.uncategorized
  const atRisk = budgets.filter((b) => b.status !== "ok")
  if (!uncategorized?.count && atRisk.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-line rounded-3xl px-5 py-3.5 mb-4">
      <span className="flex items-center gap-2 text-sm font-medium text-ink mr-1">
        <Bell size={16} strokeWidth={2} />
        Needs attention
      </span>
      {uncategorized && uncategorized.count > 0 && (
        <Link
          to={attention?.otherCategoryId ? `/categories/${attention.otherCategoryId}` : "/transactions"}
          className="text-[13px] font-medium rounded-full px-3.5 py-1.5 bg-coral-soft text-[#712b13] hover:bg-coral/40 transition-colors"
        >
          {uncategorized.count} {uncategorized.count === 1 ? "transaction" : "transactions"} without a useful category (
          {formatMoney(uncategorized.amount, currency, { whole: true })}) · Sort them →
        </Link>
      )}
      {atRisk.map((b) => (
        <Link
          key={b.id}
          to="/budgets"
          className="text-[13px] font-medium rounded-full px-3.5 py-1.5 bg-gold-soft text-[#633806] hover:bg-gold/40 transition-colors"
        >
          {b.name}{" "}
          {b.status === "over"
            ? `${formatMoney(b.spent - b.limit, b.currency, { whole: true })} over budget`
            : `at ${Math.round(b.used * 100)}% with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
        </Link>
      ))}
    </div>
  )
}

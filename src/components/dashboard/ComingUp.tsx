import { Link } from "react-router-dom"
import { formatMoney } from "../../lib/format"
import { relativeDay } from "../../lib/recurring"
import type { UpcomingPayment } from "../../types"
import DashboardCard from "./DashboardCard"

/** Recurring payments in the next 14 days, with the ones waiting for you marked. */
export default function ComingUp({
  payments,
  currency,
  onConfirm,
}: {
  payments: UpcomingPayment[]
  currency: string
  onConfirm: (payment: UpcomingPayment) => void
}) {
  const shown = payments.slice(0, 6)
  const outgoing = payments.filter((p) => p.type === "expense").reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardCard
      label="Next 14 days"
      title="Coming up"
      action={
        <Link to="/recurring" className="text-sm font-medium text-stone hover:text-ink transition-colors">
          All →
        </Link>
      }
    >
      {payments.length === 0 ? (
        <div className="bg-cream rounded-2xl p-5">
          <p className="text-sm text-stone mb-3">Nothing scheduled. Add rent, subscriptions or salary once, and they'll show up here before they're due.</p>
          <Link to="/recurring" className="inline-block bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft">
            Add recurring
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line">
            {shown.map((p) => (
              <div key={`${p.recurringId}-${p.date}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-20 shrink-0 text-xs ${p.status === "due" ? "text-plum font-medium" : "text-stone"}`}>
                    {relativeDay(p.date)}
                  </span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.category?.color ?? "#9a9893" }} />
                  <span className="text-ink truncate">{p.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-medium tabular-nums ${p.type === "income" ? "text-[#4f7a45]" : "text-ink"}`}>
                    {p.type === "income" ? "+" : ""}
                    {!p.autoAdd && "~"}
                    {formatMoney(p.amount, p.currency, { whole: false })}
                  </span>
                  {p.status === "due" && (
                    <button onClick={() => onConfirm(p)} className="bg-plum text-white rounded-full px-3 py-1 text-xs font-medium hover:bg-plum/90">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone mt-3">
            {formatMoney(outgoing, currency, { whole: true })} going out
            {payments.length > shown.length && ` · ${payments.length - shown.length} more`}
            {payments.some((p) => !p.autoAdd) && " · ~ amount you confirm"}
          </p>
        </>
      )}
    </DashboardCard>
  )
}

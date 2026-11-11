import type { CategoryChanges } from "../../hooks/useTransactions"
import { formatMoney, monthName, shiftMonth } from "../../lib/format"
import DashboardCard from "./DashboardCard"

const MIN_CHANGE = 5 // ignore moves smaller than this, they're noise

/** The categories that moved most compared with the usual, as bars either side of a centre line. */
export default function WhatChanged({ data, month, currency }: { data?: CategoryChanges; month: string; currency: string }) {
  const rows = (data?.categories ?? [])
    .map((c) => ({ ...c, change: c.current - c.average }))
    .filter((c) => Math.abs(c.change) >= MIN_CHANGE)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5)
  const largest = Math.max(...rows.map((r) => Math.abs(r.change)), 1)

  const months = data?.comparedMonths ?? 3
  const from = monthName(shiftMonth(month, -months), { month: "short" })
  const to = monthName(shiftMonth(month, -1), { month: "short" })
  const label = data?.upToDay
    ? `Compared with ${from}–${to}, up to day ${data.upToDay} of each month`
    : `Compared with your ${from}–${to} average`

  return (
    <DashboardCard label={label} title="What changed">
      {rows.length === 0 ? (
        <p className="text-sm text-stone">Nothing much changed. Spending is close to your usual in every category.</p>
      ) : (
        <>
          <div className="space-y-1">
            {rows.map((row) => {
              const more = row.change > 0
              const width = (Math.abs(row.change) / largest) * 50
              return (
                <div
                  key={row.categoryId ?? "none"}
                  className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_4.5rem] items-center gap-3 py-1.5"
                  title={`${formatMoney(row.current, currency)} this month · usually ${formatMoney(row.average, currency)}`}
                >
                  <span className="text-sm text-ink truncate">
                    {row.icon && <span className="mr-1.5">{row.icon}</span>}
                    {row.name}
                  </span>
                  <div className="relative h-2.5">
                    <div className="absolute left-1/2 -top-1 -bottom-1 w-px bg-line" />
                    <div
                      className={`absolute inset-y-0 rounded-full ${more ? "left-1/2 bg-[#d85a30]" : "right-1/2 bg-[#8fae86]"}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium text-right tabular-nums ${more ? "text-[#b54a22]" : "text-[#4f7a45]"}`}>
                    {more ? "+" : "−"}
                    {formatMoney(Math.abs(row.change), currency, { whole: true })}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-stone mt-3">Green: less than usual. Red: more than usual.</p>
        </>
      )}
    </DashboardCard>
  )
}

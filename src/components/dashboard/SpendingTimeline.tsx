import { useMemo, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { SpendingTimeline as Timeline, TimelineTransaction } from "../../hooks/useTransactions"
import { formatMoney, monthName, toMonthKey } from "../../lib/format"

const UNCATEGORIZED = { name: "Uncategorized", color: "#9a9893" }
const INK = "#0f0f0e"
const STONE = "#9a9893"

type Point = { x: number; y: number; tx?: TimelineTransaction }
type Hover = { tx: TimelineTransaction; total: number; cx: number; cy: number }

function categoryOf(tx: TimelineTransaction) {
  return { name: tx.category?.name ?? UNCATEGORIZED.name, color: tx.category?.color ?? UNCATEGORIZED.color }
}

/** Dot size grows with the amount, so big purchases stand out. */
function dotRadius(amount: number) {
  return Math.min(3 + Math.sqrt(amount) * 0.75, 13)
}

/**
 * The month's running total as a line, with a dot per transaction coloured by category,
 * and last month's pace as a dashed line.
 */
export default function SpendingTimeline({ data, month, currency }: { data?: Timeline; month: string; currency: string }) {
  const [hover, setHover] = useState<Hover | null>(null)

  const { points, previous, categories, total, daysInMonth, compareDay } = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number)
    const daysInMonth = new Date(year, monthNumber, 0).getDate()
    const transactions = data?.transactions ?? []

    // Spread same-day purchases slightly so every dot stays visible.
    const perDay = new Map<number, number>()
    let running = 0
    const points: Point[] = [{ x: 0, y: 0 }]
    for (const tx of transactions) {
      const day = Number(tx.date.slice(8, 10))
      const nth = perDay.get(day) ?? 0
      perDay.set(day, nth + 1)
      running += tx.amount
      points.push({ x: day + Math.min(nth * 0.12, 0.8), y: Math.round(running * 100) / 100, tx })
    }

    const cumulative = data?.previous.cumulative ?? []
    const previous: Point[] = cumulative.slice(0, daysInMonth + 1).map((y, x) => ({ x, y }))

    const totals = new Map<string, { name: string; color: string; value: number }>()
    for (const tx of transactions) {
      const { name, color } = categoryOf(tx)
      const entry = totals.get(name) ?? { name, color, value: 0 }
      entry.value += tx.amount
      totals.set(name, entry)
    }

    // Compare with last month up to today (current month) or up to the month's end.
    const isCurrent = month === toMonthKey()
    const compareDay = isCurrent ? new Date().getDate() : daysInMonth

    return {
      points,
      previous,
      categories: [...totals.values()].sort((a, b) => b.value - a.value),
      total: running,
      daysInMonth,
      compareDay,
    }
  }, [data, month])

  const previousAtDay = data?.previous.cumulative.length
    ? data.previous.cumulative[Math.min(compareDay, data.previous.cumulative.length - 1)]
    : null
  // Nothing to compare when neither month has any spending.
  const difference = previousAtDay === null || (previousAtDay === 0 && total === 0) ? null : total - previousAtDay
  const previousName = data ? monthName(data.previous.month) : ""
  const count = data?.transactions.length ?? 0

  return (
    <section className="bg-white border border-line rounded-[32px] p-5 md:p-8 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div>
          <p className="text-[13px] font-medium text-stone mb-1">Spending through {monthName(month)}</p>
          <p className="font-display text-4xl font-semibold tracking-[-0.02em] text-ink tabular-nums">
            {formatMoney(total, currency, { whole: true })}
          </p>
        </div>
        <div className="flex gap-3">
          {difference !== null && (
            <div className="bg-cream rounded-2xl px-4 py-3">
              <p className="text-[12px] text-stone">
                vs {previousName}
                {month === toMonthKey() ? ", same day" : " total"}
              </p>
              <p
                className={`font-display text-lg font-semibold tabular-nums ${
                  difference > 0 ? "text-[#b54a22]" : difference < 0 ? "text-[#4f7a45]" : "text-ink"
                }`}
              >
                {difference > 0 ? "+" : difference < 0 ? "−" : ""}
                {formatMoney(Math.abs(difference), currency, { whole: true })}
              </p>
            </div>
          )}
          <div className="bg-cream rounded-2xl px-4 py-3">
            <p className="text-[12px] text-stone">Transactions</p>
            <p className="font-display text-lg font-semibold tabular-nums">{count}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-[12px] text-stone">
        {categories.map((c) => (
          <span key={c.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name} <span className="text-ink tabular-nums">{formatMoney(c.value, currency, { whole: true })}</span>
          </span>
        ))}
        {previous.length > 1 && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-stone/70" />
            {previousName}
          </span>
        )}
      </div>

      <div className="relative h-72" onMouseLeave={() => setHover(null)}>
        {count === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-stone pointer-events-none">
            No spending logged in {monthName(month)} yet.
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5b82e" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#f5b82e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#efede7" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, daysInMonth]}
              ticks={[1, 5, 10, 15, 20, 25, daysInMonth]}
              tickFormatter={(d: number) => `${d} ${monthName(month, { month: "short" })}`}
              tick={{ fill: STONE, fontSize: 12 }}
              axisLine={{ stroke: "#e8e6e0" }}
              tickLine={false}
              allowDuplicatedCategory={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickFormatter={(v: number) => formatMoney(v, currency, { whole: true })}
              tick={{ fill: STONE, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Line
              data={previous}
              dataKey="y"
              type="monotone"
              stroke={STONE}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              data={points}
              dataKey="y"
              type="monotone"
              stroke={INK}
              strokeWidth={2}
              fill="url(#spend-fill)"
              activeDot={false}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; index?: number; payload?: Point }) => {
                const { cx, cy, index, payload } = props
                if (cx === undefined || cy === undefined || !payload?.tx) return <g key={`dot-${index}`} />
                const tx = payload.tx
                const isHovered = hover?.tx.id === tx.id
                return (
                  <g key={tx.id} className="cursor-pointer" onMouseEnter={() => setHover({ tx, total: payload.y, cx, cy })}>
                    {/* Invisible hit area, so even the smallest dots are easy to hover. */}
                    <circle cx={cx} cy={cy} r={Math.max(dotRadius(tx.amount), 9)} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={dotRadius(tx.amount) + (isHovered ? 2 : 0)}
                      fill={categoryOf(tx).color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </g>
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {hover && (
          <div
            className="absolute z-10 pointer-events-none bg-ink text-white rounded-xl px-3 py-2 text-[13px] shadow-lg -translate-x-1/2 -translate-y-full whitespace-nowrap"
            style={{ left: hover.cx, top: hover.cy - 14 }}
          >
            <p className="font-medium">
              {hover.tx.description?.trim() || categoryOf(hover.tx).name}
              <span className="text-white/60"> · {Number(hover.tx.date.slice(8, 10))} {monthName(month, { month: "short" })}</span>
            </p>
            <p className="flex items-center gap-1.5 text-white/80">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryOf(hover.tx).color }} />
              {categoryOf(hover.tx).name}: {formatMoney(hover.tx.amount, hover.tx.currency, { whole: false })}
              {hover.tx.user.name && <span className="text-white/60"> · {hover.tx.user.name.split(" ")[0]}</span>}
            </p>
            <p className="text-white/60">Month so far: {formatMoney(hover.total, currency, { whole: false })}</p>
          </div>
        )}
      </div>
    </section>
  )
}

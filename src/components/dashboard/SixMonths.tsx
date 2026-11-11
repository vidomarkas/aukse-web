import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatMoney } from "../../lib/format"
import DashboardCard from "./DashboardCard"

const GOLD = "#f5b82e"
const SAGE = "#8fae86"
const STONE = "#9a9893"

type MonthTotals = { key: string; month: string; expenses: number; income: number }

/** Spending against income for the six months ending with the selected one. Clicking a month opens it. */
export default function SixMonths({
  data,
  selected,
  currency,
  onSelect,
}: {
  data: MonthTotals[]
  selected: string
  currency: string
  onSelect: (key: string) => void
}) {
  const select = (entry: unknown) => {
    const key = (entry as { payload?: MonthTotals; key?: string })?.payload?.key ?? (entry as { key?: string })?.key
    if (key) onSelect(key)
  }

  return (
    <DashboardCard
      label="Click a month to open it"
      title="Six months"
      action={
        <div className="flex gap-4 text-xs text-stone pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: GOLD }} />
            Spent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SAGE }} />
            Income
          </span>
        </div>
      }
    >
      <div className="h-52 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#efede7" />
            <XAxis dataKey="month" axisLine={{ stroke: "#e8e6e0" }} tickLine={false} tick={{ fill: STONE, fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={60}
              tick={{ fill: STONE, fontSize: 12 }}
              tickFormatter={(v: number) => formatMoney(v, currency, { whole: true })}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,15,14,0.04)" }}
              contentStyle={{ background: "#0f0f0e", border: "none", borderRadius: 12, color: "#fff", fontSize: 13 }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name) => [formatMoney(Number(value), currency, { whole: false }), name === "expenses" ? "Spent" : "Income"]}
            />
            <Bar dataKey="expenses" radius={[6, 6, 0, 0]} maxBarSize={28} onClick={select} className="cursor-pointer">
              {data.map((d) => (
                <Cell key={d.key} fill={GOLD} fillOpacity={d.key === selected ? 1 : 0.45} />
              ))}
            </Bar>
            <Bar dataKey="income" radius={[6, 6, 0, 0]} maxBarSize={28} onClick={select} className="cursor-pointer">
              {data.map((d) => (
                <Cell key={d.key} fill={SAGE} fillOpacity={d.key === selected ? 1 : 0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}

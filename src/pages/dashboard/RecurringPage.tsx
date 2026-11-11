import { useState } from "react"
import { Pause, Play, Plus, Repeat } from "lucide-react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import RecurringFormDialog from "../../components/recurring/RecurringFormDialog"
import ConfirmDueDialog, { type DuePayment } from "../../components/recurring/ConfirmDueDialog"
import { useHouseholds, useActiveHouseholdData } from "../../hooks/useHousehold"
import { useDeleteRecurring, useRecurring, useUpdateRecurring } from "../../hooks/useRecurring"
import { formatMoney } from "../../lib/format"
import { describeSchedule, relativeDay } from "../../lib/recurring"
import type { RecurringPayment } from "../../types"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-line rounded-2xl px-4 py-3">
      <p className="text-[12px] text-stone">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

function Row({
  item,
  onEdit,
  onConfirm,
}: {
  item: RecurringPayment
  onEdit: () => void
  onConfirm: () => void
}) {
  const update = useUpdateRecurring()
  const remove = useDeleteRecurring()
  const status = item.hasEnded ? "Ended" : !item.isActive ? "Paused" : null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base"
          style={{ backgroundColor: `${item.category?.color ?? "#9a9893"}22` }}
        >
          {item.category?.icon ?? <Repeat size={16} className="text-stone" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink truncate">
            {item.description}
            {status && <span className="ml-2 text-xs font-medium rounded-full px-2 py-0.5 bg-cream text-stone">{status}</span>}
          </p>
          <p className="text-xs text-stone truncate">
            {describeSchedule(item.frequency, item.interval, item.startDate)}
            {item.category && ` · ${item.category.name}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto">
        <div className="text-left sm:text-right">
          <p className={`text-sm font-semibold font-display tabular-nums ${item.type === "income" ? "text-[#4f7a45]" : "text-ink"}`}>
            {item.type === "income" ? "+" : ""}
            {formatMoney(item.amount, item.currency, { whole: false })}
          </p>
          <p className="text-xs text-stone whitespace-nowrap">
            {item.isActive ? (
              <>
                {item.isDue ? "Due " : "Next "}
                {relativeDay(item.nextDueDate).toLowerCase().startsWith("in ") ? relativeDay(item.nextDueDate) : relativeDay(item.nextDueDate).toLowerCase()}
                {" · "}
                {item.autoAdd ? "auto" : "you confirm"}
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {item.isDue && (
            <button onClick={onConfirm} className="bg-gold text-ink rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 mr-1">
              Confirm
            </button>
          )}
          {!item.hasEnded && (
            <button
              onClick={() => update.mutate({ id: item.id, isActive: !item.isActive })}
              disabled={update.isPending}
              title={item.isActive ? "Pause" : "Resume (continues from today)"}
              aria-label={item.isActive ? `Pause ${item.description}` : `Resume ${item.description}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-cream hover:text-ink"
            >
              {item.isActive ? <Pause size={15} /> : <Play size={15} />}
            </button>
          )}
          <button onClick={onEdit} className="text-xs font-medium text-stone hover:text-ink px-2 py-2">
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${item.description}"? Payments it already added stay in your transactions.`)) remove.mutate(item.id)
            }}
            disabled={remove.isPending}
            className="text-xs font-medium text-stone hover:text-[#b54a22] px-2 py-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, items, render }: { title: string; items: RecurringPayment[]; render: (item: RecurringPayment) => React.ReactNode }) {
  if (items.length === 0) return null
  return (
    <section className="bg-white border border-line rounded-3xl px-5 md:px-7 py-2 mb-4">
      <h2 className="font-display text-lg font-semibold text-ink pt-4 pb-1">{title}</h2>
      <div className="divide-y divide-line">{items.map(render)}</div>
    </section>
  )
}

export default function RecurringPage() {
  const { isLoading: householdLoading } = useHouseholds()
  const household = useActiveHouseholdData()
  const { data: items = [], isLoading, isError, refetch } = useRecurring(household?.id)
  const [form, setForm] = useState<{ editing: RecurringPayment | null } | null>(null)
  const [due, setDue] = useState<DuePayment | null>(null)

  if (householdLoading) return <Layout><p className="text-stone">Loading…</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  const active = items.filter((i) => i.isActive)
  const waiting = active.filter((i) => i.isDue)
  const scheduled = active.filter((i) => !i.isDue)
  const inactive = items.filter((i) => !i.isActive)
  const monthlyOut = active.filter((i) => i.type === "expense").reduce((sum, i) => sum + i.monthlyAmount, 0)
  const monthlyIn = active.filter((i) => i.type === "income").reduce((sum, i) => sum + i.monthlyAmount, 0)
  const next = scheduled[0]

  const row = (item: RecurringPayment) => (
    <Row
      key={item.id}
      item={item}
      onEdit={() => setForm({ editing: item })}
      onConfirm={() => setDue({ recurringId: item.id, description: item.description, amount: item.amount, currency: item.currency, date: item.nextDueDate.slice(0, 10) })}
    />
  )

  return (
    <Layout>
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium text-stone mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            {household.name}
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-[-0.035em] text-ink">Recurring</h1>
        </div>
        <button
          onClick={() => setForm({ editing: null })}
          className="shrink-0 inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft transition-colors"
        >
          <Plus size={16} /> Add recurring
        </button>
      </header>

      {isLoading ? (
        <p className="text-stone">Loading…</p>
      ) : isError ? (
        <div className="flex items-center justify-between gap-4 bg-coral-soft/50 rounded-3xl p-5">
          <p className="text-sm text-[#712b13]">Couldn't load recurring payments.</p>
          <button onClick={() => refetch()} className="bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-line rounded-3xl p-8 text-center max-w-xl mx-auto">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-gold-soft items-center justify-center mb-4">
            <Repeat size={20} />
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink mb-2">No recurring payments yet</h2>
          <p className="text-sm text-stone mb-6">
            Add rent, subscriptions, salary or bills once. Aukse adds them on their date, or asks you to confirm the amount for bills that change.
            You can also turn an existing transaction into one with "Make recurring".
          </p>
          <button onClick={() => setForm({ editing: null })} className="bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft">
            Add your first
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Out per month" value={formatMoney(monthlyOut, "EUR", { whole: true })} />
            <Stat label="In per month" value={formatMoney(monthlyIn, "EUR", { whole: true })} />
            <Stat label="Active" value={String(active.length)} />
            <Stat label="Next" value={next ? relativeDay(next.nextDueDate) : "—"} />
          </div>
          <Section title="Waiting for you to confirm" items={waiting} render={row} />
          <Section title="Scheduled" items={scheduled} render={row} />
          <Section title="Paused and ended" items={inactive} render={row} />
        </>
      )}

      {form && (
        <RecurringFormDialog
          key={form.editing?.id ?? "new"}
          open
          onOpenChange={(open) => !open && setForm(null)}
          householdId={household.id}
          editing={form.editing}
        />
      )}
      {due && <ConfirmDueDialog key={due.recurringId} due={due} onClose={() => setDue(null)} />}
    </Layout>
  )
}

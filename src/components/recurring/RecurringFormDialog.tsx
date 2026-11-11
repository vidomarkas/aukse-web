import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories } from "../../hooks/useCategories"
import { useCreateRecurring, useUpdateRecurring } from "../../hooks/useRecurring"
import { describeSchedule } from "../../lib/recurring"
import type { Frequency, RecurringPayment, Transaction } from "../../types"

type Form = {
  description: string
  amount: string
  type: "expense" | "income" | "transfer"
  categoryId: string
  frequency: Frequency
  interval: string
  startDate: string
  hasEnd: boolean
  endDate: string
  autoAdd: boolean
}

function initialForm(editing?: RecurringPayment | null, from?: Transaction | null): Form {
  if (editing) {
    return {
      description: editing.description,
      amount: String(editing.amount),
      type: editing.type,
      categoryId: editing.categoryId ?? "",
      frequency: editing.frequency,
      interval: String(editing.interval),
      startDate: editing.startDate.slice(0, 10),
      hasEnd: !!editing.endDate,
      endDate: editing.endDate?.slice(0, 10) ?? "",
      autoAdd: editing.autoAdd,
    }
  }
  return {
    description: from?.description?.trim() ?? "",
    amount: from ? String(from.amount) : "",
    type: from?.type ?? "expense",
    categoryId: from?.categoryId ?? "",
    frequency: "monthly",
    interval: "1",
    startDate: (from?.date ?? new Date().toISOString()).slice(0, 10),
    hasEnd: false,
    endDate: "",
    autoAdd: true,
  }
}

const label = "block text-[13px] font-medium text-ink mb-1.5"

function Choice({ selected, onClick, title, text }: { selected: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`text-left rounded-2xl border p-3.5 transition-colors ${selected ? "border-ink bg-cream" : "border-line hover:bg-cream/60"}`}
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs text-stone mt-0.5">{text}</p>
    </button>
  )
}

/**
 * Add or edit a recurring payment. With `fromTransaction` it's "Make recurring": the form is filled
 * from that transaction, which becomes the first payment. Mount with a `key` so each opening starts fresh.
 */
export default function RecurringFormDialog({
  open,
  onOpenChange,
  householdId,
  editing,
  fromTransaction,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  editing?: RecurringPayment | null
  fromTransaction?: Transaction | null
}) {
  const { data: categories = [] } = useCategories(householdId)
  const createRecurring = useCreateRecurring()
  const updateRecurring = useUpdateRecurring()
  const [form, setForm] = useState<Form>(() => initialForm(editing, fromTransaction))
  const [error, setError] = useState<string | null>(null)
  const saving = createRecurring.isPending || updateRecurring.isPending
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))

  const fitting = categories.filter((c) => (form.type === "transfer" ? true : c.isIncome === (form.type === "income")))
  const interval = Math.max(1, Math.round(Number(form.interval) || 1))
  const valid = form.description.trim() && Number(form.amount) > 0 && form.startDate && (!form.hasEnd || form.endDate >= form.startDate)

  async function save() {
    if (!valid) return
    setError(null)
    const payload = {
      description: form.description.trim(),
      amount: Number(form.amount),
      currency: editing?.currency ?? fromTransaction?.currency ?? "EUR",
      type: form.type,
      categoryId: form.categoryId || null,
      frequency: form.frequency,
      interval,
      startDate: form.startDate,
      endDate: form.hasEnd ? form.endDate : null,
      autoAdd: form.autoAdd,
    }
    try {
      if (editing) await updateRecurring.mutateAsync({ id: editing.id, ...payload })
      else await createRecurring.mutateAsync({ ...payload, householdId, fromTransactionId: fromTransaction?.id })
      onOpenChange(false)
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Couldn't save. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-7 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.01em]">
            {editing ? "Edit recurring payment" : fromTransaction ? "Make it recurring" : "New recurring payment"}
          </DialogTitle>
          {fromTransaction && (
            <p className="text-sm text-stone">
              This transaction counts as the first payment; the next one follows the schedule below.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
            <div>
              <label className={label} htmlFor="rec-desc">Name</label>
              <Input id="rec-desc" placeholder="e.g. Rent, Netflix, Gym" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="rec-amount">{form.autoAdd ? "Amount" : "Usual amount"}</label>
              <Input id="rec-amount" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Form["type"], categoryId: "" }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={label}>Category</label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {fitting.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <span className={label}>Repeats</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone">Every</span>
              <Input aria-label="Interval" type="number" min="1" max="365" className="w-20" value={form.interval} onChange={(e) => set("interval", e.target.value)} />
              <Select value={form.frequency} onValueChange={(v) => set("frequency", v as Frequency)}>
                <SelectTrigger className="w-36" aria-label="Frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{interval === 1 ? "day" : "days"}</SelectItem>
                  <SelectItem value="weekly">{interval === 1 ? "week" : "weeks"}</SelectItem>
                  <SelectItem value="monthly">{interval === 1 ? "month" : "months"}</SelectItem>
                  <SelectItem value="yearly">{interval === 1 ? "year" : "years"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="rec-start">{fromTransaction ? "First payment" : "Starts"}</label>
              <Input id="rec-start" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className={`${label} flex items-center gap-2`}>
                <input type="checkbox" checked={form.hasEnd} onChange={(e) => set("hasEnd", e.target.checked)} className="accent-ink" />
                Ends
              </label>
              <Input type="date" aria-label="End date" disabled={!form.hasEnd} value={form.endDate} min={form.startDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>
          {form.startDate && (
            <p className="text-xs text-stone -mt-2">{describeSchedule(form.frequency, interval, form.startDate)}</p>
          )}

          <div>
            <span className={label}>When it's due</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Choice selected={form.autoAdd} onClick={() => set("autoAdd", true)} title="Add it automatically" text="Same amount every time, e.g. rent, Netflix, gym." />
              <Choice selected={!form.autoAdd} onClick={() => set("autoAdd", false)} title="Ask me to confirm" text="Amount changes, e.g. electricity. You enter the real amount." />
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-[#b54a22] bg-coral-soft/50 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={save}
            disabled={!valid || saving}
            className="w-full bg-ink text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Save recurring payment"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

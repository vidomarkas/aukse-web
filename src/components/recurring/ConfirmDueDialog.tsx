import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useConfirmRecurring, useSkipRecurring } from "../../hooks/useRecurring"
import { formatMoney } from "../../lib/format"

export type DuePayment = { recurringId: string; description: string; amount: number; currency: string; date: string }

/** A due payment that waits for you: enter the real amount and add it, or skip this time. */
export default function ConfirmDueDialog({ due, onClose }: { due: DuePayment; onClose: () => void }) {
  const confirm = useConfirmRecurring()
  const skip = useSkipRecurring()
  const [amount, setAmount] = useState(String(due.amount))
  const [error, setError] = useState<string | null>(null)
  const busy = confirm.isPending || skip.isPending
  const date = new Date(`${due.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      onClose()
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-7 bg-white">
        <DialogHeader>
          <p className="text-[13px] font-medium text-stone">Due {date}</p>
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.01em]">{due.description}</DialogTitle>
          <p className="text-sm text-stone">Usually {formatMoney(due.amount, due.currency, { whole: false })}. Enter what it actually came to.</p>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <Input type="number" min="0" step="0.01" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="h-12 text-lg rounded-2xl" />
          {error && <p role="alert" className="text-sm text-[#b54a22]">{error}</p>}
          <button
            onClick={() => run(() => confirm.mutateAsync({ id: due.recurringId, amount: Number(amount) }))}
            disabled={busy || !(Number(amount) > 0)}
            className="w-full bg-ink text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-ink-soft disabled:opacity-50"
          >
            {confirm.isPending ? "Adding…" : "Add payment"}
          </button>
          <button onClick={() => run(() => skip.mutateAsync(due.recurringId))} disabled={busy} className="w-full text-sm font-medium text-stone hover:text-ink py-1">
            {skip.isPending ? "Skipping…" : "Skip this time"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

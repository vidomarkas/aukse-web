import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories } from "../../hooks/useCategories"
import { useCreateTransaction, useUpdateTransaction } from "../../hooks/useTransactions"
import type { Transaction } from "../../types"

type FormState = {
  amount: string
  currency: string
  type: "expense" | "income" | "transfer"
  description: string
  date: string
  categoryId?: string
}

function initialForm(editing: Transaction | null, defaultCategoryId?: string): FormState {
  if (editing) {
    return {
      amount: String(editing.amount),
      currency: editing.currency,
      type: editing.type,
      description: editing.description ?? "",
      date: editing.date.split("T")[0],
      categoryId: editing.categoryId ?? undefined,
    }
  }
  return {
    amount: "",
    currency: "EUR",
    type: "expense",
    description: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: defaultCategoryId,
  }
}

/**
 * Add or edit a transaction. Mount it with a `key` per transaction so the form starts fresh each time.
 * `defaultCategoryId` pre-selects a category for new transactions (used on a category's page).
 */
export default function TransactionFormDialog({
  open,
  onOpenChange,
  householdId,
  editing,
  defaultCategoryId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  editing: Transaction | null
  defaultCategoryId?: string
}) {
  const { data: categories } = useCategories(householdId)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const [form, setForm] = useState<FormState>(() => initialForm(editing, defaultCategoryId))
  const saving = createTransaction.isPending || updateTransaction.isPending

  async function handleSubmit() {
    if (editing) {
      await updateTransaction.mutateAsync({ id: editing.id, ...form, amount: parseFloat(form.amount) })
    } else {
      await createTransaction.mutateAsync({ ...form, amount: parseFloat(form.amount), householdId })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as FormState["type"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.categoryId ?? ""} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Button className="w-full" onClick={handleSubmit} disabled={saving || !form.amount}>
            {saving ? "Saving..." : editing ? "Update transaction" : "Save transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

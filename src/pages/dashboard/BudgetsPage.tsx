import { useState } from "react"
import Layout from "../../components/Layout"
import { useHousehold } from "../../hooks/useHousehold"
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from "../../hooks/useBudgets"
import { useCategories } from "../../hooks/useCategories"
import { useTransactions } from "../../hooks/useTransactions"
import BudgetProgressBar from "../../components/BudgetProgressBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Budget } from "../../types"
import CreateHousehold from "../../components/CreateHousehold"

type FormState = {
  categoryId: string
  amount: string
  currency: string
  period: "monthly" | "yearly"
  startDate: string
}

const emptyForm: FormState = {
  categoryId: "",
  amount: "",
  currency: "EUR",
  period: "monthly",
  startDate: new Date().toISOString().split("T")[0],
}

export default function BudgetsPage() {
  const { data: household, isLoading: householdLoading } = useHousehold()
  const { data: budgets, isLoading } = useBudgets(household?.id)
  const { data: categories } = useCategories(household?.id)
  const { data: transactions } = useTransactions(household?.id)
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  // calculate spending per category from transactions
  function getSpentForBudget(budget: Budget) {
    if (!transactions) return 0
    const now = new Date()
    const periodStart = budget.period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1)

    return transactions.data
      .filter((tx) =>
        tx.type === "expense" &&
        (!budget.categoryId || tx.categoryId === budget.categoryId) &&
        new Date(tx.date) >= periodStart
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(budget: Budget) {
    setEditing(budget)
    setForm({
      categoryId: budget.categoryId ?? "",
      amount: String(budget.amount),
      currency: budget.currency,
      period: budget.period,
      startDate: budget.startDate.split("T")[0],
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!household) return
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId || undefined,
      householdId: household.id,
    }
    if (editing) {
      await updateBudget.mutateAsync({ id: editing.id, ...payload })
    } else {
      await createBudget.mutateAsync(payload)
    }
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return
    await deleteBudget.mutateAsync(id)
  }

  if (householdLoading) return <Layout><p>Loading...</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
        <Button onClick={openCreate}>Add budget</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit budget" : "New budget"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category (leave empty for overall)" />
              </SelectTrigger>
              <SelectContent>
                {categories?.filter(c => !c.isIncome).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Amount limit"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Select
              value={form.period}
              onValueChange={(v) => setForm({ ...form, period: v as "monthly" | "yearly" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createBudget.isPending || updateBudget.isPending || !form.amount}
            >
              {createBudget.isPending || updateBudget.isPending
                ? "Saving..."
                : editing ? "Update budget" : "Save budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : budgets?.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">No budgets yet. Add one to start tracking your spending.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {budgets?.map((budget) => {
            const spent = getSpentForBudget(budget)
            const category = categories?.find(c => c.id === budget.categoryId)
            return (
              <div key={budget.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(budget)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <BudgetProgressBar
                  name={category?.name ?? "Overall"}
                  icon={category?.icon}
                  color={category?.color}
                  spent={spent}
                  limit={Number(budget.amount)}
                  currency={budget.currency}
                  period={budget.period}
                />
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
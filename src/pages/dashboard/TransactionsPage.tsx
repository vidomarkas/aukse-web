import { useState } from "react"
import Layout from "../../components/Layout"
import { useHousehold } from "../../hooks/useHousehold"
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "../../hooks/useTransactions"
import { useCategories } from "../../hooks/useCategories"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Transaction } from "../../types"
import CreateHousehold from "../../components/CreateHousehold"

type FormState = {
  amount: string
  currency: string
  type: "expense" | "income" | "transfer"
  description: string
  date: string
  categoryId?: string
}

const emptyForm: FormState = {
  amount: "",
  currency: "EUR",
  type: "expense",
  description: "",
  date: new Date().toISOString().split("T")[0],
  categoryId: undefined,
}

export default function TransactionsPage() {
  const { data: household, isLoading: householdLoading } = useHousehold()
  const { data, isLoading } = useTransactions(household?.id)
  const { data: categories } = useCategories(household?.id)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setForm({
      amount: String(tx.amount),
      currency: tx.currency,
      type: tx.type,
      description: tx.description ?? "",
      date: tx.date.split("T")[0],
      categoryId: tx.categoryId ?? undefined,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!household) return
    if (editing) {
      await updateTransaction.mutateAsync({
        id: editing.id,
        ...form,
        amount: parseFloat(form.amount),
      })
    } else {
      await createTransaction.mutateAsync({
        ...form,
        amount: parseFloat(form.amount),
        householdId: household.id,
      })
    }
    setOpen(false)
    setForm(emptyForm)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return
    await deleteTransaction.mutateAsync(id)
  }

  if (householdLoading) return <Layout><p>Loading...</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <Button onClick={openCreate}>Add transaction</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as "expense" | "income" | "transfer" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.categoryId ?? ""}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
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
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createTransaction.isPending || updateTransaction.isPending}
            >
              {createTransaction.isPending || updateTransaction.isPending
                ? "Saving..."
                : editing ? "Update transaction" : "Save transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-gray-500">Loading transactions...</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{tx.description ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {tx.category ? `${tx.category.icon} ${tx.category.name}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      tx.type === "income"
                        ? "bg-green-100 text-green-700"
                        : tx.type === "transfer"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount} {tx.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(tx)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-xs text-red-500 hover:underline"
                        disabled={deleteTransaction.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
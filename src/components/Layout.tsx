import { Link, useLocation } from "react-router-dom"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useState } from "react"
import { useHousehold } from "../hooks/useHousehold"
import { useCategories } from "../hooks/useCategories"
import { useCreateTransaction } from "../hooks/useTransactions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wallet } from "lucide-react"

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transactions", href: "/transactions" },
  { label: "Categories", href: "/categories" },
  { label: "Budgets", href: "/budgets" },
]

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

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { user } = useUser()
  const { data: household } = useHousehold()
  const { data: categories } = useCategories(household?.id)
  const createTransaction = useCreateTransaction()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  async function handleSubmit() {
    if (!household) return
    await createTransaction.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
      householdId: household.id,
    })
    setOpen(false)
    setForm(emptyForm)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">
            <img src="/aukse-logo.svg" alt="aukse" className="h-8" />
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t flex items-center gap-2">
          <UserButton />
          <span className="text-sm text-gray-600">
            {user?.firstName ?? user?.emailAddresses[0].emailAddress}
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 relative">
        {children}

        {/* Floating add button */}
        {household && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-2xl"
          >
            <Wallet />
          </button>
        )}
      </main>

      {/* Quick add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              autoFocus
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
              disabled={createTransaction.isPending || !form.amount}
            >
              {createTransaction.isPending ? "Saving..." : "Save transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
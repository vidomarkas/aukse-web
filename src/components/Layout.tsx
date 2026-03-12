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
import { ArrowLeftRight, LayoutDashboard, PiggyBank, Tag, Wallet } from "lucide-react"

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
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
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 bg-white border-r flex-col shrink-0">
        <div className="p-4 border-b">
          <img src="/aukse-logo.svg" alt="aukse" className="h-8" />
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
        <div className="p-4 border-t flex items-center gap-2 min-w-0">
          <UserButton />
          <span className="text-sm text-gray-600 truncate">
            {user?.firstName ?? user?.emailAddresses[0].emailAddress}
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center px-4 py-3 bg-white border-b shrink-0">
          <img src="/aukse-logo.svg" alt="aukse" className="h-7" />
          <div className="ml-auto">
            <UserButton />
          </div>
        </div>

        {/* Page content — extra bottom padding on mobile for the tab bar */}
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Floating add button — sits above bottom nav on mobile */}
        {household && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <Wallet />
          </button>
        )}
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-30">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

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

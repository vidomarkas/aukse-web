import { Link, useLocation } from "react-router-dom"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useState, useEffect } from "react"
import { useActiveHouseholdData } from "../hooks/useHousehold"
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
import { ArrowLeftRight, LayoutDashboard, Menu, PiggyBank, Plus, Settings, Tag, X } from "lucide-react"
import HouseholdSwitcher from "./HouseholdSwitcher"
import CreateHousehold from "./CreateHousehold"
import InviteDialog from "./InviteDialog"
import MemberAvatars from "./MemberAvatars"

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
  { label: "Settings", href: "/settings", icon: Settings },
]

// Items shown in the mobile bottom tab bar (subset of nav)
const bottomTabs = nav.filter((item) =>
  ["/dashboard", "/transactions", "/budgets"].includes(item.href)
)

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

/** The wordmark from aukse.app: a gold dot and "Aukse" in General Sans. */
function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">
      <span className="w-3.5 h-3.5 rounded-full bg-gold" />
      Aukse
    </Link>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { user } = useUser()
  const household = useActiveHouseholdData()
  const { data: categories } = useCategories(household?.id)
  const createTransaction = useCreateTransaction()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [createHouseholdOpen, setCreateHouseholdOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Invite dialog: from the sidebar's + button, or as onboarding step 2 right after creating a household.
  const [invite, setInvite] = useState<{ id: string; name: string; welcome: boolean } | null>(null)

  // Close drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleOpenCreate() {
      setCreateHouseholdOpen(true)
    }
    function handleCreated(event: Event) {
      const { id, name } = (event as CustomEvent<{ id: string; name: string }>).detail
      setCreateHouseholdOpen(false)
      setInvite({ id, name, welcome: true })
    }
    window.addEventListener("open-create-household", handleOpenCreate)
    window.addEventListener("household-created", handleCreated)
    return () => {
      window.removeEventListener("open-create-household", handleOpenCreate)
      window.removeEventListener("household-created", handleCreated)
    }
  }, [])

  function openInvite() {
    if (household) setInvite({ id: household.id, name: household.name, welcome: false })
  }

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
    <div className="flex h-screen bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 bg-cream border-r border-line flex-col shrink-0">
        <div className="px-6 py-5">
          <Logo />
        </div>
        <div className="pt-1">
          <HouseholdSwitcher />
          <MemberAvatars householdId={household?.id} onInvite={openInvite} />
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                  active ? "bg-ink text-white" : "text-stone hover:bg-white hover:text-ink"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-line flex items-center gap-2 min-w-0">
          <UserButton />
          <span className="text-sm text-stone truncate">
            {user?.firstName ?? user?.emailAddresses[0].emailAddress}
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-cream/85 backdrop-blur border-b border-line shrink-0">
          <Logo />
          <UserButton />
        </div>

        {/* Page content — extra bottom padding on mobile for tab bar + floating button */}
        <div className="flex-1 overflow-auto px-4 py-6 md:px-10 md:py-10 pb-32 md:pb-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Floating add button — sits above bottom nav on mobile */}
        {household && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Add transaction"
            title="Add transaction"
            className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gold text-ink rounded-full shadow-[0_8px_24px_rgba(245,184,46,0.45)] hover:scale-105 transition-transform flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={2.25} />
          </button>
        )}
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur border-t border-line flex z-30">
        {bottomTabs.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-ink" : "text-stone"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              {item.label}
            </Link>
          )
        })}
        {/* Menu tab */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-stone transition-colors"
        >
          <Menu size={20} strokeWidth={1.75} />
          Menu
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <aside className="relative w-64 bg-cream flex flex-col h-full shadow-xl">
            <div className="px-5 py-4 flex items-center justify-between">
              <Logo />
              <button onClick={() => setDrawerOpen(false)} className="text-stone hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="pt-1">
              <HouseholdSwitcher />
              <MemberAvatars householdId={household?.id} onInvite={openInvite} />
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1">
              {nav.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                      active ? "bg-ink text-white" : "text-stone hover:bg-white hover:text-ink"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-line flex items-center gap-2 min-w-0">
              <UserButton />
              <span className="text-sm text-stone truncate">
                {user?.firstName ?? user?.emailAddresses[0].emailAddress}
              </span>
            </div>
          </aside>
        </div>
      )}

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

      {invite && (
        <InviteDialog
          householdId={invite.id}
          householdName={invite.name}
          welcome={invite.welcome}
          open
          onOpenChange={(open) => !open && setInvite(null)}
        />
      )}

      {/* Create household dialog (triggered from HouseholdSwitcher) */}
      <Dialog open={createHouseholdOpen} onOpenChange={setCreateHouseholdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New household</DialogTitle>
          </DialogHeader>
          <CreateHousehold onCreated={() => setCreateHouseholdOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

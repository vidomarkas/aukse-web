import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { DropdownMenu } from "radix-ui"
import { House, LogOut, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useActiveHousehold } from "../../context/HouseholdContext"
import { useDeleteHousehold, useHouseholds, useRemoveMember, useUpdateHousehold } from "../../hooks/useHousehold"
import { useTransactions } from "../../hooks/useTransactions"
import { useExportData } from "../../hooks/useAccount"
import type { Household } from "../../types"

type Action = { kind: "rename" | "leave" | "delete"; household: Household }

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback
}

const dialogClass = "sm:max-w-md rounded-3xl p-7 bg-white"
const primary = "bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft disabled:opacity-40"
const danger = "bg-[#d4532b] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#b54a22] disabled:opacity-40"
const quiet = "rounded-full px-5 py-2.5 text-sm font-medium text-stone hover:text-ink"

function RenameDialog({ household, onClose }: { household: Household; onClose: () => void }) {
  const update = useUpdateHousehold()
  const [name, setName] = useState(household.name)
  const [error, setError] = useState<string | null>(null)
  const changed = name.trim() && name.trim() !== household.name

  async function save() {
    if (!changed) return onClose()
    try {
      await update.mutateAsync({ id: household.id, name: name.trim() })
      onClose()
    } catch (err) {
      setError(errorMessage(err, "Couldn't rename the household."))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">Rename household</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} autoFocus className="rounded-full h-11 px-4" />
        {error && <p role="alert" className="text-sm text-[#b54a22]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={quiet}>Cancel</button>
          <button onClick={save} disabled={!changed || update.isPending} className={primary}>{update.isPending ? "Saving…" : "Save"}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LeaveDialog({ household, userId, onClose }: { household: Household; userId: string; onClose: () => void }) {
  const removeMember = useRemoveMember()
  const { activeHouseholdId, setActiveHouseholdId } = useActiveHousehold()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function leave() {
    try {
      await removeMember.mutateAsync({ householdId: household.id, userId })
      if (activeHouseholdId === household.id) {
        setActiveHouseholdId(null)
        navigate("/dashboard")
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err, "Couldn't leave the household."))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">Leave {household.name}?</DialogTitle>
          <p className="text-sm text-stone">
            You'll lose access to its transactions, budgets and recurring payments. What you logged stays there as household history.
            To come back, you'll need a new invite.
          </p>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-[#b54a22]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={quiet}>Cancel</button>
          <button onClick={leave} disabled={removeMember.isPending} className={danger}>{removeMember.isPending ? "Leaving…" : "Leave household"}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Shows what's at stake and asks for the household's name before deleting it. */
function DeleteDialog({ household, onClose }: { household: Household; onClose: () => void }) {
  const deleteHousehold = useDeleteHousehold()
  const exportData = useExportData()
  const { data } = useTransactions(household.id, 1, 1)
  const { activeHouseholdId, setActiveHouseholdId } = useActiveHousehold()
  const navigate = useNavigate()
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const members = household.members?.length ?? 1
  const transactions = data?.meta.total

  async function remove() {
    try {
      await deleteHousehold.mutateAsync(household.id)
      if (activeHouseholdId === household.id) {
        setActiveHouseholdId(null)
        navigate("/dashboard")
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete the household."))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !deleteHousehold.isPending && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">Delete {household.name}?</DialogTitle>
          <p className="text-sm text-stone">This can't be undone.</p>
        </DialogHeader>
        <div className="bg-coral-soft/50 rounded-2xl p-4 text-sm text-ink space-y-1">
          <p>
            Permanently deletes{" "}
            <strong className="font-semibold">
              {transactions === undefined ? "all" : transactions.toLocaleString("en-GB")} {transactions === 1 ? "transaction" : "transactions"}
            </strong>
            , and every budget, category and recurring payment in it.
          </p>
          {members > 1 && (
            <p>
              <strong className="font-semibold">{members - 1} other {members - 1 === 1 ? "member loses" : "members lose"}</strong> access too.
            </p>
          )}
        </div>
        <button
          onClick={() => exportData.mutate()}
          disabled={exportData.isPending}
          className="self-start text-sm font-medium text-ink underline underline-offset-4 hover:no-underline disabled:opacity-60"
        >
          {exportData.isPending ? "Preparing export…" : exportData.isSuccess ? "Export downloaded" : "Export your data first"}
        </button>
        <div>
          <label htmlFor="confirm-household" className="block text-[13px] font-medium text-ink mb-1.5">
            Type <span className="font-semibold">{household.name}</span> to confirm
          </label>
          <Input id="confirm-household" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="rounded-full h-11 px-4" />
        </div>
        {error && <p role="alert" className="text-sm text-[#b54a22]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={deleteHousehold.isPending} className={quiet}>Cancel</button>
          <button onClick={remove} disabled={typed.trim() !== household.name.trim() || deleteHousehold.isPending} className={danger}>
            {deleteHousehold.isPending ? "Deleting…" : "Delete household"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MenuItem({ icon: Icon, label, onSelect, tone }: { icon: typeof Pencil; label: string; onSelect: () => void; tone?: "danger" }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer data-[highlighted]:bg-cream ${
        tone === "danger" ? "text-[#b54a22]" : "text-ink"
      }`}
    >
      <Icon size={15} /> {label}
    </DropdownMenu.Item>
  )
}

/**
 * Settings → Your households: every household you're in, with switching, renaming, leaving and
 * deleting in one place. Destructive actions sit in a menu and always go through a dialog.
 */
export default function HouseholdsManager({ activeId }: { activeId: string }) {
  const { data: households = [] } = useHouseholds()
  const { setActiveHouseholdId } = useActiveHousehold()
  const { user } = useUser()
  const [action, setActionState] = useState<Action | null>(null)
  const openingDialog = useRef(false)
  const setAction = (next: Action | null) => {
    if (next) openingDialog.current = true
    setActionState(next)
  }
  const atLimit = households.length >= 5

  return (
    <section className="bg-white border border-line rounded-3xl p-5 md:p-7 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[13px] font-medium text-stone mb-1">Households you belong to</p>
          <h2 className="font-display text-xl font-semibold text-ink">Your households</h2>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-create-household"))}
          disabled={atLimit}
          title={atLimit ? "You can belong to up to 5 households" : undefined}
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-ink-soft disabled:opacity-40"
        >
          <Plus size={15} /> New household
        </button>
      </div>

      <div className="divide-y divide-line">
        {households.map((h) => {
          const active = h.id === activeId
          const count = h.members?.length ?? 0
          const isAdmin = h.members?.some((m) => m.userId === user?.id && m.role === "owner") ?? false
          return (
            <div key={h.id} className={`flex items-center gap-3 py-3.5 ${active ? "" : ""}`}>
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${active ? "bg-gold-soft text-ink" : "bg-cream text-stone"}`}>
                <House size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate flex items-center gap-2">
                  {h.name}
                  {active && <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-ink text-white">Active</span>}
                </p>
                <p className="text-xs text-stone">
                  {isAdmin ? "Admin" : "Member"} · {count} {count === 1 ? "member" : "members"}
                </p>
              </div>
              {!active && (
                <button onClick={() => setActiveHouseholdId(h.id)} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink border border-line hover:bg-cream">
                  Switch to
                </button>
              )}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  aria-label={`More actions for ${h.name}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-cream hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <MoreHorizontal size={18} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    // The menu normally returns focus to "⋯" when it closes. If an item just opened a dialog,
                    // that focus move counts as "outside the dialog" and closes it at once, so skip it then.
                    onCloseAutoFocus={(e) => {
                      if (openingDialog.current) e.preventDefault()
                      openingDialog.current = false
                    }}
                    className="z-50 min-w-48 rounded-2xl border border-line bg-white p-1.5 shadow-lg"
                  >
                    {isAdmin && <MenuItem icon={Pencil} label="Rename" onSelect={() => setAction({ kind: "rename", household: h })} />}
                    {!isAdmin && <MenuItem icon={LogOut} label="Leave household" tone="danger" onSelect={() => setAction({ kind: "leave", household: h })} />}
                    {isAdmin && (
                      <>
                        <DropdownMenu.Separator className="my-1 h-px bg-line" />
                        <MenuItem icon={Trash2} label="Delete household" tone="danger" onSelect={() => setAction({ kind: "delete", household: h })} />
                      </>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          )
        })}
      </div>

      {action?.kind === "rename" && <RenameDialog household={action.household} onClose={() => setAction(null)} />}
      {action?.kind === "leave" && user && <LeaveDialog household={action.household} userId={user.id} onClose={() => setAction(null)} />}
      {action?.kind === "delete" && <DeleteDialog household={action.household} onClose={() => setAction(null)} />}
    </section>
  )
}

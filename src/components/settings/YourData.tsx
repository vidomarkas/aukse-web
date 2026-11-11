import { useState } from "react"
import { useClerk } from "@clerk/clerk-react"
import { Download, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useActiveHousehold } from "../../context/HouseholdContext"
import { useDeleteAccount, useDeletionPreview, useExportData } from "../../hooks/useAccount"

const CONFIRM_WORD = "DELETE"

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback
}

/** Explains what deleting the account does, then deletes it once the user types the confirmation. */
function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const preview = useDeletionPreview(true)
  const deleteAccount = useDeleteAccount()
  const exportData = useExportData()
  const { signOut } = useClerk()
  const { setActiveHouseholdId } = useActiveHousehold()
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setError(null)
    try {
      await deleteAccount.mutateAsync()
      setActiveHouseholdId(null)
      await signOut({ redirectUrl: "/" })
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete your account. Please try again."))
    }
  }

  const data = preview.data
  return (
    <Dialog open onOpenChange={(open) => !open && !deleteAccount.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-7 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.01em]">Delete your account?</DialogTitle>
          <p className="text-sm text-stone">This can't be undone. Here's exactly what happens:</p>
        </DialogHeader>

        {preview.isPending ? (
          <Loader2 size={18} className="animate-spin text-stone" />
        ) : preview.isError || !data ? (
          <p className="text-sm text-[#b54a22]">Couldn't load what will be deleted. Close this and try again.</p>
        ) : (
          <ul className="space-y-3 text-sm text-ink">
            {data.deleted.length > 0 && (
              <li className="bg-coral-soft/50 rounded-2xl p-4">
                <p className="font-medium mb-1">Deleted completely</p>
                <p className="text-stone">
                  {data.deleted.map((h) => h.name).join(", ")}: you're the only member, so the household and all its transactions,
                  budgets, categories and recurring payments are deleted.
                </p>
              </li>
            )}
            {data.kept.map((h) => (
              <li key={h.id} className="bg-cream rounded-2xl p-4">
                <p className="font-medium mb-1">{h.name} stays for the other members</p>
                <p className="text-stone">
                  {h.yourTransactions > 0
                    ? `Your ${h.yourTransactions} ${h.yourTransactions === 1 ? "transaction stays" : "transactions stay"} as shared history, shown as "Former member". `
                    : ""}
                  {h.newAdmin ? `${h.newAdmin} becomes the admin. ` : ""}
                  Recurring payments you set up carry on under the admin.
                </p>
              </li>
            ))}
            <li className="bg-cream rounded-2xl p-4">
              <p className="font-medium mb-1">Your profile and login</p>
              <p className="text-stone">Your name, email and photo are deleted from Aukse, and your login is removed, so you'll be signed out.</p>
            </li>
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 bg-gold-soft/60 rounded-2xl px-4 py-3 text-sm">
          <span className="text-[#633806]">Want a copy first?</span>
          <button
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
            className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline underline-offset-4 disabled:opacity-60"
          >
            <Download size={14} /> {exportData.isPending ? "Preparing…" : exportData.isSuccess ? "Downloaded" : "Export your data"}
          </button>
        </div>

        <div>
          <label htmlFor="confirm-delete" className="block text-[13px] font-medium text-ink mb-1.5">
            Type <span className="font-mono">{CONFIRM_WORD}</span> to confirm
          </label>
          <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="rounded-full h-11 px-4" />
        </div>
        {error && <p role="alert" className="text-sm text-[#b54a22]">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button onClick={onClose} disabled={deleteAccount.isPending} className="rounded-full px-5 py-2.5 text-sm font-medium text-stone hover:text-ink">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={typed.trim() !== CONFIRM_WORD || deleteAccount.isPending || !data}
            className="bg-[#d4532b] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#b54a22] disabled:opacity-40"
          >
            {deleteAccount.isPending ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Settings → Your data: download everything, or delete the account. */
export default function YourData() {
  const exportData = useExportData()
  const [deleting, setDeleting] = useState(false)

  return (
    <section className="bg-white border border-line rounded-3xl p-5 md:p-7 mb-4">
      <p className="text-[13px] font-medium text-stone mb-1">Your account</p>
      <h2 className="font-display text-xl font-semibold text-ink mb-5">Your data</h2>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <p className="text-sm font-medium text-ink">Export everything</p>
          <p className="text-sm text-stone">
            A ZIP with spreadsheets of your transactions, budgets, categories and recurring payments for every household you're in, plus a
            complete JSON file.
          </p>
          {exportData.isError && <p className="text-sm text-[#b54a22] mt-1">{errorMessage(exportData.error, "Export failed. Please try again.")}</p>}
        </div>
        <button
          onClick={() => exportData.mutate()}
          disabled={exportData.isPending}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink-soft disabled:opacity-60"
        >
          <Download size={15} /> {exportData.isPending ? "Preparing…" : "Export data"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm font-medium text-ink">Delete account</p>
          <p className="text-sm text-stone">Removes your profile and login. You'll see exactly what happens to each household before anything is deleted.</p>
        </div>
        <button
          onClick={() => setDeleting(true)}
          className="shrink-0 border border-[#f3c7b6] text-[#b54a22] rounded-full px-5 py-2.5 text-sm font-medium hover:bg-coral-soft/50"
        >
          Delete account
        </button>
      </div>

      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </section>
  )
}

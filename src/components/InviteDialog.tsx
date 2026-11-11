import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import InvitePanel from "./InvitePanel"

/**
 * "Invite your partner". Opened from the sidebar's + button, and right after creating a household
 * (`welcome`), where it doubles as the second onboarding step.
 */
export default function InviteDialog({
  householdId,
  householdName,
  open,
  onOpenChange,
  welcome = false,
}: {
  householdId: string
  householdName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  welcome?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-7 bg-white">
        <DialogHeader>
          {welcome && (
            <p className="flex items-center gap-2 text-[13px] font-medium text-stone">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {householdName} is ready · Step 2 of 2
            </p>
          )}
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.01em]">Invite your partner</DialogTitle>
          <p className="text-sm text-stone">
            Once they join, you both see the same budgets, categories and transactions in {householdName}.
          </p>
        </DialogHeader>
        <div className="mt-2">
          <InvitePanel householdId={householdId} />
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="mt-1 text-sm font-medium text-stone hover:text-ink transition-colors"
        >
          {welcome ? "Skip for now" : "Done"}
        </button>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { useCreateInvitation } from "../hooks/useHousehold"
import { inviteLink, useCopy } from "../lib/invites"

/** Creates an invite link for the household and lets you copy it. Aukse doesn't email it for you. */
export default function InvitePanel({ householdId }: { householdId: string }) {
  const createInvitation = useCreateInvitation()
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  async function create() {
    setError(null)
    try {
      const invitation = await createInvitation.mutateAsync({ householdId })
      const url = inviteLink(invitation.token)
      setLink(url)
      await copy(url).catch(() => {}) // copying can be blocked; the link is still shown
    } catch {
      setError("Couldn't create an invite link. Please try again.")
    }
  }

  if (!link) {
    return (
      <div className="space-y-2">
        <button
          onClick={create}
          disabled={createInvitation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          <Link2 size={16} />
          {createInvitation.isPending ? "Creating link…" : "Create invite link"}
        </button>
        {error && <p className="text-sm text-[#b54a22]">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-cream border border-line rounded-full pl-4 pr-1.5 py-1.5">
        <span className="flex-1 min-w-0 truncate text-sm text-ink">{link}</span>
        <button
          onClick={() => copy(link)}
          className="shrink-0 inline-flex items-center gap-1.5 bg-gold text-ink rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition"
        >
          {copied === link ? <Check size={15} /> : <Copy size={15} />}
          {copied === link ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-stone">
        Send this link to your partner by message or email. It works once and expires in 7 days.
      </p>
    </div>
  )
}

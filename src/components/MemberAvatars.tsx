import { Plus } from "lucide-react"
import { useHouseholdMembers } from "../hooks/useHousehold"
import { initials } from "../lib/format"

const AVATAR_COLORS = ["bg-gold-soft", "bg-coral-soft", "bg-sage", "bg-plum-soft"]

/** The household's members as overlapping avatars, with a + button to invite someone. */
export default function MemberAvatars({ householdId, onInvite }: { householdId?: string; onInvite: () => void }) {
  const { data: members = [] } = useHouseholdMembers(householdId)
  if (!householdId) return null
  const shown = members.slice(0, 4)
  const extra = members.length - shown.length

  return (
    <div className="flex items-center gap-2 px-5 pb-3">
      <div className="flex -space-x-2">
        {shown.map((m, i) => (
          <span
            key={m.id}
            title={m.user.name ?? m.user.email}
            className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} w-8 h-8 rounded-full ring-2 ring-cream flex items-center justify-center font-display text-[11px] font-semibold text-ink`}
          >
            {initials(m.user.name ?? m.user.email)}
          </span>
        ))}
        {extra > 0 && (
          <span className="w-8 h-8 rounded-full ring-2 ring-cream bg-white flex items-center justify-center text-[11px] font-medium text-stone">
            +{extra}
          </span>
        )}
      </div>
      <button
        onClick={onInvite}
        title="Invite someone"
        aria-label="Invite someone to this household"
        className="w-8 h-8 rounded-full border border-dashed border-stone/50 text-stone flex items-center justify-center hover:border-ink hover:text-ink hover:bg-white transition-colors"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

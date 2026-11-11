import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { Check, Copy, Loader2 } from "lucide-react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import DashboardCard from "../../components/dashboard/DashboardCard"
import YourData from "../../components/settings/YourData"
import HouseholdsManager from "../../components/settings/HouseholdsManager"
import InvitePanel from "../../components/InvitePanel"
import { inviteLink, useCopy } from "../../lib/invites"
import { useActiveHousehold } from "../../context/HouseholdContext"
import {
  useActiveHouseholdData,
  useCancelInvitation,
  useHouseholdInvitations,
  useHouseholdMembers,
  useHouseholds,
  useRemoveMember,
} from "../../hooks/useHousehold"
import { initials } from "../../lib/format"
import type { Household } from "../../types"

const AVATAR_COLORS = ["bg-gold-soft", "bg-coral-soft", "bg-sage", "bg-plum-soft"]

function MembersSection({ household, isOwner, myUserId }: { household: Household; isOwner: boolean; myUserId?: string }) {
  const { data: members = [], isLoading } = useHouseholdMembers(household.id)
  const { data: invitations = [] } = useHouseholdInvitations(household.id)
  const removeMember = useRemoveMember()
  const cancelInvitation = useCancelInvitation()
  const { setActiveHouseholdId } = useActiveHousehold()
  const navigate = useNavigate()
  const { copied, copy } = useCopy()
  const pending = invitations.filter((inv) => inv.status === "pending")

  async function remove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from ${household.name}? They'll lose access to its transactions and budgets.`)) return
    await removeMember.mutateAsync({ householdId: household.id, userId })
  }

  async function leave() {
    if (!myUserId || !confirm(`Leave ${household.name}? You'll need a new invite to come back.`)) return
    await removeMember.mutateAsync({ householdId: household.id, userId: myUserId })
    setActiveHouseholdId(null)
    navigate("/dashboard")
  }

  return (
    <DashboardCard label={`Members of ${household.name}`} title="Members and invites" className="mb-4">
      {isLoading ? (
        <Loader2 size={18} className="animate-spin text-stone" />
      ) : (
        <div className="divide-y divide-line">
          {members.map((member, i) => {
            const isMe = member.userId === myUserId
            const name = member.user.name ?? member.user.email
            return (
              <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display text-sm font-semibold text-ink`}>
                    {initials(member.user.name ?? member.user.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {name}
                      {isMe && <span className="text-stone font-normal"> · you</span>}
                    </p>
                    <p className="text-xs text-stone truncate">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${member.role === "owner" ? "bg-gold-soft text-[#633806]" : "bg-cream text-stone"}`}>
                    {member.role === "owner" ? "Admin" : "Member"}
                  </span>
                  {isOwner && !isMe && (
                    <button onClick={() => remove(member.userId, name)} disabled={removeMember.isPending} className="text-sm font-medium text-[#b54a22] hover:underline">
                      Remove
                    </button>
                  )}
                  {isMe && member.role !== "owner" && (
                    <button onClick={leave} disabled={removeMember.isPending} className="text-sm font-medium text-[#b54a22] hover:underline">
                      Leave
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-line">
        <p className="text-sm font-medium text-ink mb-3">Invite someone</p>
        <InvitePanel householdId={household.id} />
      </div>

      {pending.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink mb-1">Waiting to join</p>
          <div className="divide-y divide-line">
            {pending.map((inv) => {
              const link = inviteLink(inv.token)
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{inv.email ?? "Invite link"}</p>
                    <p className="text-xs text-stone">Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => copy(link)} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-ink">
                      {copied === link ? <Check size={14} /> : <Copy size={14} />}
                      {copied === link ? "Copied" : "Copy link"}
                    </button>
                    <button
                      onClick={() => cancelInvitation.mutateAsync({ householdId: household.id, invitationId: inv.id })}
                      disabled={cancelInvitation.isPending}
                      className="text-sm font-medium text-[#b54a22] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

export default function SettingsPage() {
  const { isLoading } = useHouseholds()
  const household = useActiveHouseholdData()
  const { user } = useUser()
  const { data: members = [] } = useHouseholdMembers(household?.id)

  if (isLoading) return <Layout><p className="text-stone">Loading…</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  const isOwner = members.find((m) => m.userId === user?.id)?.role === "owner"

  return (
    <Layout>
      <header className="mb-8 md:mb-10">
        <p className="flex items-center gap-2 text-[13px] font-medium text-stone mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          {household.name}
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-[-0.035em] text-ink">Settings</h1>
      </header>

      <div className="max-w-3xl">
        <HouseholdsManager activeId={household.id} />
        <MembersSection household={household} isOwner={isOwner} myUserId={user?.id} />
        <YourData />
      </div>
    </Layout>
  )
}

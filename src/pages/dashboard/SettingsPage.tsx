import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { Check, Copy, Loader2, Pencil, Plus } from "lucide-react"
import Layout from "../../components/Layout"
import CreateHousehold from "../../components/CreateHousehold"
import DashboardCard from "../../components/dashboard/DashboardCard"
import InvitePanel from "../../components/InvitePanel"
import { inviteLink, useCopy } from "../../lib/invites"
import { Input } from "@/components/ui/input"
import { useActiveHousehold } from "../../context/HouseholdContext"
import {
  useActiveHouseholdData,
  useCancelInvitation,
  useDeleteHousehold,
  useHouseholdInvitations,
  useHouseholdMembers,
  useHouseholds,
  useRemoveMember,
  useUpdateHousehold,
} from "../../hooks/useHousehold"
import { initials } from "../../lib/format"
import type { Household } from "../../types"

const AVATAR_COLORS = ["bg-gold-soft", "bg-coral-soft", "bg-sage", "bg-plum-soft"]

function HouseholdNameSection({ household, canEdit }: { household: Household; canEdit: boolean }) {
  const updateHousehold = useUpdateHousehold()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(household.name)

  async function save() {
    if (!name.trim() || name.trim() === household.name) return setEditing(false)
    await updateHousehold.mutateAsync({ id: household.id, name: name.trim() })
    setEditing(false)
  }

  return (
    <DashboardCard label="Household" title="Name" className="mb-4">
      {editing ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save()
              if (e.key === "Escape") setEditing(false)
            }}
            autoFocus
            className="rounded-full h-11 px-4"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={updateHousehold.isPending || !name.trim()}
              className="bg-ink text-white rounded-full px-5 h-11 text-sm font-medium hover:bg-ink-soft disabled:opacity-50"
            >
              {updateHousehold.isPending ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setName(household.name); setEditing(false) }} className="rounded-full px-4 h-11 text-sm font-medium text-stone hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-2xl font-semibold text-ink">{household.name}</p>
          {canEdit && (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-ink">
              <Pencil size={14} /> Rename
            </button>
          )}
        </div>
      )}
    </DashboardCard>
  )
}

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
    <DashboardCard label="Who's in this household" title="Members" className="mb-4">
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

function HouseholdsSection({ activeId }: { activeId: string }) {
  const { data: households = [] } = useHouseholds()
  const { setActiveHouseholdId } = useActiveHousehold()
  const atLimit = households.length >= 5

  return (
    <DashboardCard
      label="Households you belong to"
      title="Your households"
      className="mb-4"
      action={
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-create-household"))}
          disabled={atLimit}
          title={atLimit ? "You can belong to up to 5 households" : undefined}
          className="inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-ink-soft disabled:opacity-40"
        >
          <Plus size={15} /> New household
        </button>
      }
    >
      <div className="divide-y divide-line">
        {households.map((h) => {
          const active = h.id === activeId
          const count = h.members?.length ?? 0
          return (
            <div key={h.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{h.name}</p>
                <p className="text-xs text-stone">
                  {count} {count === 1 ? "member" : "members"}
                </p>
              </div>
              {active ? (
                <span className="text-xs font-medium rounded-full px-2.5 py-1 bg-ink text-white">Active</span>
              ) : (
                <button onClick={() => setActiveHouseholdId(h.id)} className="text-sm font-medium text-stone hover:text-ink">
                  Switch to
                </button>
              )}
            </div>
          )
        })}
      </div>
    </DashboardCard>
  )
}

function DangerZone({ household }: { household: Household }) {
  const deleteHousehold = useDeleteHousehold()
  const { setActiveHouseholdId } = useActiveHousehold()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  async function remove() {
    await deleteHousehold.mutateAsync(household.id)
    setActiveHouseholdId(null)
    navigate("/dashboard")
  }

  return (
    <section className="border border-[#f3c7b6] bg-white rounded-3xl p-5 md:p-7">
      <p className="text-[13px] font-medium text-[#b54a22] mb-1">Danger zone</p>
      <h2 className="font-display text-xl font-semibold text-ink mb-2">Delete {household.name}</h2>
      <p className="text-sm text-stone mb-4">
        Permanently deletes the household with all its transactions, budgets and categories, for every member. This can't be undone.
      </p>
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <button onClick={remove} disabled={deleteHousehold.isPending} className="bg-[#d4532b] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#b54a22] disabled:opacity-60">
            {deleteHousehold.isPending ? "Deleting…" : `Yes, delete ${household.name}`}
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-full px-5 py-2.5 text-sm font-medium text-stone hover:text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="border border-[#f3c7b6] text-[#b54a22] rounded-full px-5 py-2.5 text-sm font-medium hover:bg-coral-soft/50">
          Delete household
        </button>
      )}
    </section>
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
        <HouseholdNameSection key={household.id} household={household} canEdit={isOwner} />
        <MembersSection household={household} isOwner={isOwner} myUserId={user?.id} />
        <HouseholdsSection activeId={household.id} />
        {isOwner && <DangerZone household={household} />}
      </div>
    </Layout>
  )
}

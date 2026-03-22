import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { Copy, Check, Loader2, Pencil, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Household } from "../types"
import {
  useHouseholdMembers,
  useRemoveMember,
  useUpdateHousehold,
  useDeleteHousehold,
  useCreateInvitation,
  useHouseholdInvitations,
  useCancelInvitation,
} from "../hooks/useHousehold"
import { useActiveHousehold } from "../context/HouseholdContext"

type Tab = "general" | "members" | "invite"

interface Props {
  household: Household
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function HouseholdSettings({ household, open, onOpenChange }: Props) {
  const { user } = useUser()
  const { setActiveHouseholdId } = useActiveHousehold()

  const [tab, setTab] = useState<Tab>("general")
  const [isRenaming, setIsRenaming] = useState(false)
  const [name, setName] = useState(household.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const { data: members = [], isLoading: membersLoading } = useHouseholdMembers(household.id)
  const { data: invitations = [], isLoading: invitationsLoading } = useHouseholdInvitations(household.id)

  const updateHousehold = useUpdateHousehold()
  const deleteHousehold = useDeleteHousehold()
  const removeMember = useRemoveMember()
  const createInvitation = useCreateInvitation()
  const cancelInvitation = useCancelInvitation()

  const myMember = members.find((m) => m.user.email === user?.emailAddresses[0].emailAddress)
  const isOwner = myMember?.role === "owner"

  async function handleSaveName() {
    if (!name.trim() || name === household.name) return
    await updateHousehold.mutateAsync({ id: household.id, name: name.trim() })
    setIsRenaming(false)
  }

  function handleCancelRename() {
    setName(household.name)
    setIsRenaming(false)
  }

  async function handleDelete() {
    await deleteHousehold.mutateAsync(household.id)
    setActiveHouseholdId(null)
    onOpenChange(false)
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member from the household?")) return
    await removeMember.mutateAsync({ householdId: household.id, userId })
  }

  async function handleLeave() {
    if (!myMember) return
    if (!confirm("Leave this household?")) return
    await removeMember.mutateAsync({ householdId: household.id, userId: myMember.userId })
    setActiveHouseholdId(null)
    onOpenChange(false)
  }

  async function handleGenerateLink() {
    const inv = await createInvitation.mutateAsync({ householdId: household.id })
    setGeneratedLink(`${window.location.origin}/invite/${inv.token}`)
  }

  async function handleCopyLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopiedToken(link)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleCancelInvitation(invitationId: string) {
    await cancelInvitation.mutateAsync({ householdId: household.id, invitationId })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "members", label: "Members" },
    { id: "invite", label: "Invite" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <p className="text-sm text-gray-500">
            Managing <span className="font-medium text-gray-700">{household.name}</span>
          </p>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b -mx-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* General tab */}
        {tab === "general" && (
          <div className="space-y-6 pt-2">
            {/* Household name — view or edit */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Household name</p>
              {!isRenaming ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{household.name}</span>
                  {isOwner && (
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <Pencil size={12} />
                      Rename
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName()
                        if (e.key === "Escape") handleCancelRename()
                      }}
                      autoFocus
                      placeholder="Household name"
                    />
                    <Button
                      onClick={handleSaveName}
                      disabled={updateHousehold.isPending || !name.trim() || name === household.name}
                      size="sm"
                    >
                      {updateHousehold.isPending ? "Saving..." : "Save"}
                    </Button>
                    <button
                      onClick={handleCancelRename}
                      className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danger zone */}
            {isOwner && (
              <div className="border border-red-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-red-700">Danger zone</p>
                <p className="text-xs text-gray-500">
                  Permanently deletes <span className="font-medium">{household.name}</span> and all
                  its transactions, budgets and categories. This cannot be undone.
                </p>
                {!confirmDelete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete "{household.name}"
                  </Button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteHousehold.isPending}
                    >
                      {deleteHousehold.isPending ? "Deleting..." : "Yes, delete it"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Members tab */}
        {tab === "members" && (
          <div className="pt-2">
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isMe = member.user.email === user?.emailAddresses[0].emailAddress
                  return (
                    <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.user.name ?? member.user.email}
                          {isMe && <span className="ml-1 text-gray-400 font-normal">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          member.role === "owner"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {member.role}
                        </span>
                        {isOwner && !isMe && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removeMember.isPending}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                        {isMe && member.role !== "owner" && (
                          <button
                            onClick={handleLeave}
                            disabled={removeMember.isPending}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Invite tab */}
        {tab === "invite" && (
          <div className="space-y-4 pt-2">
            <div>
              <Button
                className="w-full"
                onClick={handleGenerateLink}
                disabled={createInvitation.isPending}
              >
                {createInvitation.isPending ? "Generating..." : "Generate invite link"}
              </Button>
              {generatedLink && (
                <div className="mt-3 flex items-center gap-2">
                  <Input value={generatedLink} readOnly className="text-xs" />
                  <button
                    onClick={() => handleCopyLink(generatedLink)}
                    className="shrink-0 p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Copy link"
                  >
                    {copiedToken === generatedLink ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Pending invitations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pending invitations</h4>
              {invitationsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : invitations.filter((inv) => inv.status === "pending").length === 0 ? (
                <p className="text-sm text-gray-400">No pending invitations.</p>
              ) : (
                <div className="space-y-2">
                  {invitations
                    .filter((inv) => inv.status === "pending")
                    .map((inv) => {
                      const link = `${window.location.origin}/invite/${inv.token}`
                      return (
                        <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 truncate">
                              {inv.email ?? "Link invitation"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <button
                              onClick={() => handleCopyLink(link)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                              title="Copy link"
                            >
                              {copiedToken === link ? (
                                <Check size={13} className="text-green-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              disabled={cancelInvitation.isPending}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

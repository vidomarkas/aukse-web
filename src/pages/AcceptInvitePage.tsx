import { useParams, useNavigate } from "react-router-dom"
import { SignIn, useUser } from "@clerk/clerk-react"
import { useInvitation, useAcceptInvitation } from "../hooks/useHousehold"
import { useActiveHousehold } from "../context/HouseholdContext"
import { Button } from "@/components/ui/button"

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useUser()
  const { setActiveHouseholdId } = useActiveHousehold()

  const { data: invitation, isLoading, error } = useInvitation(token)
  const acceptInvitation = useAcceptInvitation()

  async function handleAccept() {
    if (!token) return
    try {
      const household = await acceptInvitation.mutateAsync(token)
      setActiveHouseholdId(household.id)
      navigate("/dashboard")
    } catch (err: unknown) {
      // error is shown via acceptInvitation.error below
      console.error(err)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border rounded-lg p-8 w-full max-w-sm text-center space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Invite not found</h2>
          <p className="text-sm text-gray-500">
            This invite link is invalid, has expired, or has already been used.
          </p>
          {isSignedIn && (
            <Button className="w-full mt-2" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (invitation.status !== "pending") {
    const statusMessages: Record<string, string> = {
      accepted: "This invitation has already been accepted.",
      declined: "This invitation was declined.",
      expired: "This invitation has expired.",
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border rounded-lg p-8 w-full max-w-sm text-center space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Invite unavailable</h2>
          <p className="text-sm text-gray-500">
            {statusMessages[invitation.status] ?? "This invitation is no longer valid."}
          </p>
          {isSignedIn && (
            <Button className="w-full mt-2" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border rounded-lg p-8 w-full max-w-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">You're invited</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-700">
              {invitation.inviter.name ?? invitation.inviter.email}
            </span>{" "}
            invited you to join{" "}
            <span className="font-medium text-gray-700">{invitation.household.name}</span>.
          </p>
        </div>

        {!isSignedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Sign in to accept this invitation.</p>
            <SignIn
              routing="hash"
              afterSignInUrl={`/invite/${token}`}
              afterSignUpUrl={`/invite/${token}`}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {acceptInvitation.error && (
              <p className="text-sm text-red-600">
                {(acceptInvitation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Something went wrong. Please try again."}
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptInvitation.isPending}
            >
              {acceptInvitation.isPending
                ? "Joining..."
                : `Join ${invitation.household.name}`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

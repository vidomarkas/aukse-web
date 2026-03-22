import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { Household, HouseholdMember, Invitation } from "../types"
import { useActiveHousehold } from "../context/HouseholdContext"

export function useHouseholds() {
  const api = useApi()

  return useQuery({
    queryKey: ["households"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Household[] }>("/households")
      return data.data
    },
  })
}

export function useActiveHouseholdData() {
  const { data: households = [] } = useHouseholds()
  const { activeHouseholdId, setActiveHouseholdId } = useActiveHousehold()

  const activeHousehold = households.find((h) => h.id === activeHouseholdId) ?? households[0] ?? null

  useEffect(() => {
    if (!activeHouseholdId && households.length > 0) {
      setActiveHouseholdId(households[0].id)
    }
  }, [households, activeHouseholdId, setActiveHouseholdId])

  return activeHousehold
}

// kept for backwards compatibility — callers that just need a single household
export function useHousehold() {
  const api = useApi()

  return useQuery({
    queryKey: ["household-single"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Household[] }>("/households")
      return data.data[0] ?? null
    },
  })
}

export function useCreateHousehold() {
  const api = useApi()
  const queryClient = useQueryClient()
  const { setActiveHouseholdId } = useActiveHousehold()

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<{ data: Household }>("/households", { name })
      return data.data
    },
    onSuccess: (household) => {
      setActiveHouseholdId(household.id)
      queryClient.invalidateQueries({ queryKey: ["households"] })
    },
  })
}

export function useUpdateHousehold() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.patch<{ data: Household }>(`/households/${id}`, { name })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] })
    },
  })
}

export function useDeleteHousehold() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/households/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] })
    },
  })
}

export function useHouseholdMembers(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["household-members", householdId],
    queryFn: async () => {
      const { data } = await api.get<{ data: HouseholdMember[] }>(`/households/${householdId}/members`)
      return data.data
    },
    enabled: !!householdId,
  })
}

export function useRemoveMember() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ householdId, userId }: { householdId: string; userId: string }) => {
      await api.delete(`/households/${householdId}/members/${userId}`)
    },
    onSuccess: (_data, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: ["household-members", householdId] })
    },
  })
}

export function useCreateInvitation() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ householdId, email }: { householdId: string; email?: string }) => {
      const { data } = await api.post<{ data: Invitation }>(`/households/${householdId}/invitations`, { email })
      return data.data
    },
    onSuccess: (_data, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations", householdId] })
    },
  })
}

export function useHouseholdInvitations(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["household-invitations", householdId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Invitation[] }>(`/households/${householdId}/invitations`)
      return data.data
    },
    enabled: !!householdId,
  })
}

export function useCancelInvitation() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ householdId, invitationId }: { householdId: string; invitationId: string }) => {
      await api.delete(`/households/${householdId}/invitations/${invitationId}`)
    },
    onSuccess: (_data, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations", householdId] })
    },
  })
}

export function useInvitation(token: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      const { data } = await api.get<{ data: Invitation }>(`/invitations/${token}`)
      return data.data
    },
    enabled: !!token,
    retry: false,
  })
}

export function useAcceptInvitation() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post<{ data: Household }>(`/invitations/${token}/accept`)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] })
    },
  })
}

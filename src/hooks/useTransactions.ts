import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { PaginatedResponse, Transaction } from "../types"

export function useTransactions(householdId: string | undefined, page = 1, limit = 20) {
  const api = useApi()

  return useQuery({
    queryKey: ["transactions", householdId, page, limit],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Transaction>>("/transactions", {
        params: { householdId, page, limit },
      })
      return data
    },
    enabled: !!householdId,
    placeholderData: (prev) => prev, // keep previous page visible while next loads
  })
}

export function useCreateTransaction() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<Transaction>) => {
      const { data } = await api.post<Transaction>("/transactions", input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useSpendingByCategory(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["analytics", "spending-by-category", householdId],
    queryFn: async () => {
      const { data } = await api.get<{ name: string; icon: string | null; color: string; value: number }[]>(
        "/analytics/spending-by-category",
        { params: { householdId } }
      )
      return data
    },
    enabled: !!householdId,
  })
}

export function useMonthlySpending(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["analytics", "monthly-overview", householdId],
    queryFn: async () => {
      const { data } = await api.get<{ month: string; expenses: number; income: number }[]>(
        "/analytics/monthly-overview",
        { params: { householdId } }
      )
      return data
    },
    enabled: !!householdId,
  })
}

export function useCurrentMonthStats(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["analytics", "current-month-stats", householdId],
    queryFn: async () => {
      const { data } = await api.get<{ spent: number; income: number; balance: number; month: string }>(
        "/analytics/current-month-stats",
        { params: { householdId } }
      )
      return data
    },
    enabled: !!householdId,
  })
}

export function useUpdateTransaction() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Transaction> & { id: string }) => {
      const { data } = await api.patch<Transaction>(`/transactions/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useDeleteTransaction() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}
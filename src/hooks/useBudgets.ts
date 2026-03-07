import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { Budget } from "../types"

export function useBudgets(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["budgets", householdId],
    queryFn: async () => {
      const { data } = await api.get<Budget[]>("/budgets", {
        params: { householdId },
      })
      return data
    },
    enabled: !!householdId,
  })
}

export function useBudgetSpending(budgetId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["budget-spending", budgetId],
    queryFn: async () => {
      const { data } = await api.get(`/budgets/${budgetId}/spending`)
      return data
    },
    enabled: !!budgetId,
  })
}

export function useCreateBudget() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<Budget> & { householdId: string }) => {
      const { data } = await api.post<Budget>("/budgets", input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
    },
  })
}

export function useUpdateBudget() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Budget> & { id: string }) => {
      const { data } = await api.patch<Budget>(`/budgets/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
    },
  })
}

export function useDeleteBudget() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
    },
  })
}
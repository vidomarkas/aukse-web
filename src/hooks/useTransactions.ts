import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { PaginatedResponse, Transaction } from "../types"

export function useTransactions(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["transactions", householdId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Transaction>>("/transactions", {
        params: { householdId },
      })
      return data
    },
    enabled: !!householdId,
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

// derive spending by category from transactions
export function useSpendingByCategory(householdId: string | undefined) {
  const { data } = useTransactions(householdId)

  if (!data) return []

  const map = new Map<string, { name: string; value: number; color: string }>()

  data.data
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const key = tx.category?.name ?? "Uncategorized"
      const color = tx.category?.color ?? "#94a3b8"
      const existing = map.get(key)
      if (existing) {
        existing.value += Number(tx.amount)
      } else {
        map.set(key, { name: key, value: Number(tx.amount), color })
      }
    })

  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

// derive monthly spending from transactions
export function useMonthlySpending(householdId: string | undefined) {
  const { data } = useTransactions(householdId)

  if (!data) return []

  const map = new Map<string, { month: string; expenses: number; income: number }>()

  data.data.forEach((tx) => {
    const month = new Date(tx.date).toLocaleString("default", { month: "short", year: "numeric" })
    const existing = map.get(month) ?? { month, expenses: 0, income: 0 }
    if (tx.type === "expense") existing.expenses += Number(tx.amount)
    if (tx.type === "income") existing.income += Number(tx.amount)
    map.set(month, existing)
  })

  return Array.from(map.values()).reverse()
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
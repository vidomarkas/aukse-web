import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import type { Frequency, RecurringPayment, UpcomingPayment } from "../types"

export type RecurringInput = {
  description: string
  amount: number
  currency: string
  type: "expense" | "income" | "transfer"
  categoryId?: string | null
  frequency: Frequency
  interval: number
  startDate: string
  endDate?: string | null
  autoAdd: boolean
}

/** Recurring changes can add transactions, so everything that shows transactions is refreshed. */
function useRefresh() {
  const queryClient = useQueryClient()
  return () => {
    for (const key of ["recurring", "transactions", "analytics", "budgets"]) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }
}

export function useRecurring(householdId: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ["recurring", householdId],
    queryFn: async () => (await api.get<RecurringPayment[]>("/recurring", { params: { householdId } })).data,
    enabled: !!householdId,
  })
}

/** Payments in the next `days` days, plus ones waiting for confirmation. */
export function useUpcomingPayments(householdId: string | undefined, days = 14) {
  const api = useApi()
  return useQuery({
    queryKey: ["recurring", "upcoming", householdId, days],
    queryFn: async () => (await api.get<UpcomingPayment[]>("/recurring/upcoming", { params: { householdId, days } })).data,
    enabled: !!householdId,
  })
}

export function useCreateRecurring() {
  const api = useApi()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: RecurringInput & { householdId: string; fromTransactionId?: string }) =>
      (await api.post<RecurringPayment>("/recurring", input)).data,
    onSuccess: refresh,
  })
}

export function useUpdateRecurring() {
  const api = useApi()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<RecurringInput> & { id: string; isActive?: boolean }) =>
      (await api.patch<RecurringPayment>(`/recurring/${id}`, input)).data,
    onSuccess: refresh,
  })
}

export function useDeleteRecurring() {
  const api = useApi()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recurring/${id}`)
    },
    onSuccess: refresh,
  })
}

export function useConfirmRecurring() {
  const api = useApi()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => (await api.post(`/recurring/${id}/confirm`, { amount })).data,
    onSuccess: refresh,
  })
}

export function useSkipRecurring() {
  const api = useApi()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/recurring/${id}/skip`)).data,
    onSuccess: refresh,
  })
}

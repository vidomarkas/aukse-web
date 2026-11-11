import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { PaginatedResponse, Transaction } from "../types"

export function useTransactions(
  householdId: string | undefined,
  page = 1,
  limit = 20,
  filters: { categoryId?: string } = {},
) {
  const api = useApi()

  return useQuery({
    queryKey: ["transactions", householdId, page, limit, filters.categoryId ?? null],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Transaction>>("/transactions", {
        params: { householdId, page, limit, categoryId: filters.categoryId },
      })
      return data
    },
    enabled: !!householdId,
    placeholderData: (prev) => prev, // keep previous page visible while next loads
  })
}

function invalidateTransactionDependents(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] })
  queryClient.invalidateQueries({ queryKey: ["analytics"] })
  queryClient.invalidateQueries({ queryKey: ["budgets"] })
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
      invalidateTransactionDependents(queryClient)
    },
  })
}

/** A calendar month as "YYYY-MM". Omit for the current month. */
export type MonthKey = string

export type CategorySpending = {
  categoryId: string | null
  name: string
  icon: string | null
  color: string
  value: number
}

export type CategoryChanges = {
  comparedMonths: number
  /** Set for the current month: both sides only count days up to this day. */
  upToDay: number | null
  categories: (Omit<CategorySpending, "value"> & { current: number; average: number })[]
}

export type Attention = {
  uncategorized: { count: number; amount: number }
  /** The "Other" category, where "Sort them" leads. */
  otherCategoryId: string | null
}

export type CategoryHistory = {
  category: { id: string; name: string; icon: string | null; color: string | null; isIncome: boolean }
  /** Newest first. `month` is "YYYY-MM". */
  months: { month: string; total: number; count: number }[]
}

function useAnalytics<T>(path: string, householdId: string | undefined, month?: MonthKey) {
  const api = useApi()

  return useQuery({
    queryKey: ["analytics", path, householdId, month],
    queryFn: async () => {
      const { data } = await api.get<T>(`/analytics/${path}`, { params: { householdId, month } })
      return data
    },
    enabled: !!householdId,
    placeholderData: (prev) => prev, // keep the previous month visible while the next loads
  })
}

export function useSpendingByCategory(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<CategorySpending[]>(
    "spending-by-category",
    householdId,
    month
  )
}

export function useMonthlySpending(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<{ key: string; month: string; expenses: number; income: number }[]>(
    "monthly-overview",
    householdId,
    month
  )
}

export function useCurrentMonthStats(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<{ spent: number; income: number; balance: number; month: string; key: string }>(
    "current-month-stats",
    householdId,
    month
  )
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
      invalidateTransactionDependents(queryClient)
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
      invalidateTransactionDependents(queryClient)
    },
  })
}
export type TimelineTransaction = {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  currency: string
  description: string | null
  category: { name: string; color: string | null; icon: string | null } | null
  user: { name: string | null; email: string }
}

export type SpendingTimeline = {
  month: string
  transactions: TimelineTransaction[]
  /** Last month's running total: cumulative[d] = spent from day 1 to day d. */
  previous: { month: string; cumulative: number[] }
}

/** Every expense in the month, in order, plus last month's running total. */
export function useSpendingTimeline(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<SpendingTimeline>("spending-timeline", householdId, month)
}

/** Each category this month against its average over the previous months. */
export function useCategoryChanges(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<CategoryChanges>("category-changes", householdId, month)
}

/** Data for the "needs attention" strip. */
export function useAttention(householdId: string | undefined, month?: MonthKey) {
  return useAnalytics<Attention>("attention", householdId, month)
}

/** A category's total per month over all time. */
export function useCategoryHistory(householdId: string | undefined, categoryId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["analytics", "category-history", householdId, categoryId],
    queryFn: async () => {
      const { data } = await api.get<CategoryHistory>("/analytics/category-history", { params: { householdId, categoryId } })
      return data
    },
    enabled: !!householdId && !!categoryId,
    retry: false,
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { Category } from "../types"

export function useCategories(householdId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: ["categories", householdId],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/categories", {
        params: { householdId },
      })
      return data
    },
    enabled: !!householdId,
  })
}

export function useCreateCategory() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<Category> & { householdId: string }) => {
      const { data } = await api.post<Category>("/categories", input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Category> & { id: string }) => {
      const { data } = await api.patch<Category>(`/categories/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
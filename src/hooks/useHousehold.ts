import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "../lib/axios"
import { Household } from "../types"

export function useHousehold() {
  const api = useApi()

  return useQuery({
    queryKey: ["households"],
    queryFn: async () => {
      const { data } = await api.get<Household[]>("/households")
      return data[0] ?? null
    },
  })
}

export function useCreateHousehold() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<Household>("/households", { name })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] })
    },
  })
}
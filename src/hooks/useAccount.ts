import { useMutation, useQuery } from "@tanstack/react-query"
import { useApi } from "../lib/axios"

export type DeletionPreview = {
  /** Households where you're the only member: deleted completely. */
  deleted: { id: string; name: string }[]
  /** Shared households: they stay for the others. */
  kept: { id: string; name: string; newAdmin: string | null; yourTransactions: number }[]
}

/** Downloads everything Aukse stores about you as a ZIP. */
export function useExportData() {
  const api = useApi()
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<Blob>("/me/export", { responseType: "blob" })
      const filename =
        /filename="([^"]+)"/.exec(response.headers["content-disposition"] ?? "")?.[1] ??
        `aukse-export-${new Date().toISOString().slice(0, 10)}.zip`
      const url = URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      return filename
    },
  })
}

export function useDeletionPreview(enabled: boolean) {
  const api = useApi()
  return useQuery({
    queryKey: ["me", "deletion-preview"],
    queryFn: async () => (await api.get<DeletionPreview>("/me/deletion-preview")).data,
    enabled,
    staleTime: 0,
  })
}

export function useDeleteAccount() {
  const api = useApi()
  return useMutation({
    mutationFn: async () => (await api.delete("/me")).data,
  })
}

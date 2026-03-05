import axios from "axios"
import { useAuth } from "@clerk/clerk-react"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
})

// hook that returns an authenticated axios instance
export function useApi() {
  const { getToken } = useAuth()

  api.interceptors.request.clear()
  api.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return api
}
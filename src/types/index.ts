export type Transaction = {
  id: string
  householdId: string
  accountId?: string
  categoryId?: string
  amount: number
  currency: string
  type: "expense" | "income" | "transfer"
  description?: string
  date: string
  notes?: string
  category?: Category
  account?: Account
  tags?: { tag: Tag }[]
}

export type Household = {
  id: string
  name: string
  createdBy: string
  createdAt: string
  members: HouseholdMember[]
}

export type HouseholdMember = {
  id: string
  householdId: string
  userId: string
  role: "owner" | "member"
  joinedAt: string
}

export type Account = {
  id: string
  name: string
  type: "bank" | "cash" | "credit_card" | "savings"
  currency: string
  balance: number
  isDefault: boolean
}

export type Category = {
  id: string
  householdId?: string | null
  name: string
  icon?: string
  color?: string
  isIncome: boolean
}

export type Tag = {
  id: string
  name: string
}

export type Budget = {
  id: string
  householdId: string
  categoryId?: string
  amount: number
  currency: string
  period: "monthly" | "yearly"
  startDate: string
  endDate?: string
  category?: Category
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
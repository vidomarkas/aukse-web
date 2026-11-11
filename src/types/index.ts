export type Transaction = {
  id: string
  householdId: string
  accountId?: string
  categoryId?: string
  userId: string
  /** Set when the transaction came from (or was made into) a recurring payment. */
  recurringId?: string | null
  amount: number
  currency: string
  type: "expense" | "income" | "transfer"
  description?: string
  date: string
  notes?: string
  category?: Category
  account?: Account
  tags?: { tag: Tag }[]
  user?: { id: string; name: string | null; email: string }
}

export interface HouseholdMember {
  id: string
  householdId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

export interface Invitation {
  id: string
  token: string
  householdId: string
  email: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
  createdAt: string
  inviter: { name: string | null; email: string }
  household: { id: string; name: string }
}

export type Household = {
  id: string
  name: string
  createdBy: string
  createdAt: string
  members?: HouseholdMember[]
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
  spent: number
  remaining: number
  percentage: number
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
export type Frequency = "daily" | "weekly" | "monthly" | "yearly"

export type RecurringPayment = {
  id: string
  householdId: string
  description: string
  amount: number
  currency: string
  type: "expense" | "income" | "transfer"
  categoryId: string | null
  category: { id: string; name: string; icon: string | null; color: string | null } | null
  user: { id: string; name: string | null; email: string }
  frequency: Frequency
  interval: number
  startDate: string
  endDate: string | null
  nextDueDate: string
  /** false = paused (or ended, see hasEnded). */
  isActive: boolean
  /** true: added on its due date by itself. false: waits for you to confirm the amount. */
  autoAdd: boolean
  monthlyAmount: number
  /** Waiting for you to confirm. */
  isDue: boolean
  hasEnded: boolean
}

export type UpcomingPayment = {
  recurringId: string
  description: string
  amount: number
  currency: string
  type: "expense" | "income" | "transfer"
  autoAdd: boolean
  category: RecurringPayment["category"]
  date: string
  /** "due": waiting for you to confirm. */
  status: "due" | "upcoming"
}

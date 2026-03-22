import { createContext, useContext, useState, ReactNode } from 'react'

interface HouseholdContextType {
  activeHouseholdId: string | null
  setActiveHouseholdId: (id: string | null) => void
}

const HouseholdContext = createContext<HouseholdContextType>({
  activeHouseholdId: null,
  setActiveHouseholdId: () => {},
})

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeHouseholdId')
  })

  const setActiveHouseholdId = (id: string | null) => {
    setActiveHouseholdIdState(id)
    if (id) localStorage.setItem('activeHouseholdId', id)
    else localStorage.removeItem('activeHouseholdId')
  }

  return (
    <HouseholdContext.Provider value={{ activeHouseholdId, setActiveHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useActiveHousehold() {
  return useContext(HouseholdContext)
}

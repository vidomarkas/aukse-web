import { useState } from "react"
import { ChevronDown, Check, House, Plus } from "lucide-react"
import { useHouseholds, useActiveHouseholdData } from "../hooks/useHousehold"
import { useActiveHousehold } from "../context/HouseholdContext"

export default function HouseholdSwitcher() {
  const { data: households = [] } = useHouseholds()
  const { activeHouseholdId, setActiveHouseholdId } = useActiveHousehold()
  const activeHousehold = useActiveHouseholdData()

  const [open, setOpen] = useState(false)

  const atLimit = households.length >= 5

  return (
    <>
      <div className="relative px-3 pb-3">
        <p className="px-2 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">Household</p>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Switch household"
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-full text-sm font-medium text-ink hover:bg-white transition-colors min-w-0"
        >
          <span className="flex items-center gap-2 min-w-0">
            <House size={15} className="shrink-0 text-stone" />
            <span className="truncate">{activeHousehold?.name ?? "Select household"}</span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-stone" />
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-3 right-3 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 py-1 overflow-hidden">
              {households.map((hh) => (
                <button
                  key={hh.id}
                  onClick={() => {
                    setActiveHouseholdId(hh.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate">{hh.name}</span>
                  {hh.id === activeHouseholdId && (
                    <Check size={14} className="shrink-0 text-gray-900 ml-2" />
                  )}
                </button>
              ))}
              {households.length > 0 && <div className="border-t my-1" />}
              <button
                disabled={atLimit}
                onClick={() => {
                  setOpen(false)
                  // signal to open CreateHousehold — handled by navigating to a route or opening a modal
                  // For MVP, we dispatch a custom event that Layout can listen to
                  window.dispatchEvent(new CustomEvent("open-create-household"))
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                <span>{atLimit ? "Household limit reached (5)" : "New household"}</span>
              </button>
            </div>
          </>
        )}
      </div>

    </>
  )
}

import { useUser } from "@clerk/clerk-react"
import { useState } from "react"
import { useCreateHousehold } from "../hooks/useHousehold"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CreateHousehold() {
  const { user } = useUser()
  const [name, setName] = useState("")
  const createHousehold = useCreateHousehold()

  async function handleSubmit() {
    if (!name.trim()) return
    await createHousehold.mutateAsync(name)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white border rounded-lg p-8 w-full max-w-md space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create your household</h2>
          <p className="text-gray-500 text-sm mt-1">
            A household groups your transactions and budgets together.
          </p>
        </div>
        <Input
          placeholder={`e.g. ${user?.firstName ?? "My"}'s household`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={createHousehold.isPending || !name.trim()}
        >
          {createHousehold.isPending ? "Creating..." : "Create household"}
        </Button>
      </div>
    </div>
  )
}
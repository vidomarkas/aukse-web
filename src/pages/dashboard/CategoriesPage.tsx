import { useState } from "react"
import Layout from "../../components/Layout"
import { useHousehold } from "../../hooks/useHousehold"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Category } from "../../types"
import CreateHousehold from "../../components/CreateHousehold"

type FormState = {
  name: string
  icon: string
  color: string
  isIncome: boolean
}

const emptyForm: FormState = {
  name: "",
  icon: "",
  color: "#6366f1",
  isIncome: false,
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#94a3b8",
]

export default function CategoriesPage() {
  const { data: household, isLoading: householdLoading } = useHousehold()
  const { data: categories, isLoading } = useCategories(household?.id)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(cat: Category) {
    // prevent editing system categories
    if (!cat.householdId) return
    setEditing(cat)
    setForm({
      name: cat.name,
      icon: cat.icon ?? "",
      color: cat.color ?? "#6366f1",
      isIncome: cat.isIncome,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!household) return
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, ...form })
    } else {
      await createCategory.mutateAsync({ ...form, householdId: household.id })
    }
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Transactions using it will be uncategorized.")) return
    await deleteCategory.mutateAsync(id)
  }

  if (householdLoading) return <Layout><p>Loading...</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  const systemCategories = categories?.filter((c) => !c.householdId) ?? []
  const customCategories = categories?.filter((c) => !!c.householdId) ?? []

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <Button onClick={openCreate}>Add category</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Icon (emoji)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <div>
              <p className="text-sm text-gray-600 mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      form.color === color ? "border-gray-900 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>
            <Select
              value={form.isIncome ? "income" : "expense"}
              onValueChange={(v) => setForm({ ...form, isIncome: v === "income" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createCategory.isPending || updateCategory.isPending || !form.name.trim()}
            >
              {createCategory.isPending || updateCategory.isPending
                ? "Saving..."
                : editing ? "Update category" : "Save category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Custom categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Your categories
            </h3>
            {customCategories.length === 0 ? (
              <p className="text-gray-400 text-sm">No custom categories yet.</p>
            ) : (
              <div className="bg-white border rounded-lg divide-y">
                {customCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                      >
                        {cat.icon ?? "•"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.isIncome ? "Income" : "Expense"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Default categories
            </h3>
            <div className="bg-white border rounded-lg divide-y">
              {systemCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                  >
                    {cat.icon ?? "•"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.isIncome ? "Income" : "Expense"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
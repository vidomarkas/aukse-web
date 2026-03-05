import Layout from "../../components/Layout"
import { useHousehold } from "../../hooks/useHousehold"
import CreateHousehold from "../../components/CreateHousehold"
import { useSpendingByCategory, useMonthlySpending } from "../../hooks/useTransactions"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts"

export default function DashboardPage() {
  const { data: household, isLoading } = useHousehold()
  const spendingByCategory = useSpendingByCategory(household?.id)
  const monthlySpending = useMonthlySpending(household?.id)

  if (isLoading) return <Layout><p>Loading...</p></Layout>
  if (!household) return <Layout><CreateHousehold /></Layout>

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Spending by category */}
        <div className="bg-white border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by category</h3>
          {spendingByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No expense data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => `${(value ?? 0).toFixed(2)} EUR`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1">
            {spendingByCategory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900">{entry.value.toFixed(2)} EUR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly overview */}
        <div className="bg-white border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly overview</h3>
          {monthlySpending.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  )
}
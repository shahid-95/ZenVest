import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { getSummary, getMonthlyAnalytics, getCategoryBreakdown } from '../services/api'
import { StatCard } from '../components/UI'
import { formatINR, currentMonth, formatMonth, CHART_COLORS } from '../utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e2433] border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatINR(p.value)}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [categories, setCategories] = useState([])
  const month = currentMonth()

  useEffect(() => {
    getSummary(month).then(setSummary)
    getMonthlyAnalytics().then(setMonthly)
    getCategoryBreakdown(month).then(setCategories)
  }, [])

  // Shorten "2025-06" → "Jun" for chart axis
  const chartData = monthly.map(r => ({
    ...r,
    label: new Date(r.month + '-01').toLocaleString('en-IN', { month: 'short' }),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm">{formatMonth(month)}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💼" label="Total Income"   value={formatINR(summary?.income   ?? 0)} color="text-green-400" />
        <StatCard icon="💸" label="Total Expenses" value={formatINR(summary?.expenses ?? 0)} color="text-red-400" />
        <StatCard icon="💰" label="Balance"        value={formatINR(summary?.balance  ?? 0)} color="text-indigo-400" />
        <StatCard icon="📊" label="Savings Rate"   value={`${summary?.savings_rate ?? 0}%`}  color="text-cyan-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expenses - bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-white mb-4">Income vs Expenses (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Expenses by Category</h3>
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                  {categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} />
                <Legend
                  formatter={(v) => <span className="text-xs text-slate-300">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Spending trend line chart */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-white mb-4">Spending Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="income"   name="Income"   stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

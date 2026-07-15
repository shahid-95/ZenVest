import React, { useEffect, useState } from 'react'
import { getAlerts } from '../services/api'
import { currentMonth, formatMonth } from '../utils'
import { EmptyState } from '../components/UI'

export default function Alerts() {
  const [data, setData]   = useState({ alerts: [], count: 0 })
  const [month, setMonth] = useState(currentMonth())

  useEffect(() => {
    getAlerts(month).then(setData)
  }, [month])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Budget Alerts</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{formatMonth(month)}</p>
        </div>
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
        />
      </div>

      {/* Summary banner */}
      {data.count > 0 && (
        <div className="card p-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 rounded-xl shadow-sm">
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            ⚠️ {data.count} budget alert{data.count > 1 ? 's' : ''} require your attention
          </p>
        </div>
      )}

      {/* Alerts list */}
      {data.alerts.length === 0 ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <EmptyState icon="✅" title="All clear!" sub="No budget alerts for this month. Great job staying on track!" />
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map((a, i) => {
            const isDanger = a.type === 'danger'
            return (
              <div 
                key={i} 
                className={`card p-5 flex items-start gap-4 border rounded-xl shadow-sm ${
                  isDanger
                    ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5'
                    : 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5'
                }`}
              >
                <div className="text-3xl flex-shrink-0">
                  {isDanger ? '🚨' : '⚡'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold ${isDanger ? 'text-rose-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {a.category}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isDanger
                        ? 'bg-red-100 dark:bg-red-500/20 text-rose-700 dark:text-red-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                      {isDanger ? 'Over Budget' : 'Warning'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{a.message}</p>
                  
                  {/* Progress indicator */}
                  <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(a.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">{a.percentage.toFixed(0)}% of budget used</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tips */}
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
          <span>💡</span> Budgeting Tips
        </h3>
        <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 dark:text-green-400 flex-shrink-0 font-bold">→</span> 
            The 50/30/20 rule: 50% needs, 30% wants, 20% savings
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 dark:text-green-400 flex-shrink-0 font-bold">→</span> 
            Track daily expenses — small purchases add up fast
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 dark:text-green-400 flex-shrink-0 font-bold">→</span> 
            Review your budgets each month and adjust as needed
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 dark:text-green-400 flex-shrink-0 font-bold">→</span> 
            Build an emergency fund covering 3–6 months of expenses
          </li>
        </ul>
      </div>
    </div>
  )
}
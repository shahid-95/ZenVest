/** Shared reusable UI primitives */
import React from 'react'
import { X } from 'lucide-react'

/** Summary stat card */
export function StatCard({ icon, label, value, sub, color = 'text-indigo-400', trend }) {
  return (
    <div className="card p-5 transition-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`text-2xl`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

/** Modal dialog */
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="font-display font-semibold text-white text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/** Form field wrapper */
export function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

/** Input */
export function Input({ ...props }) {
  return (
    <input
      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      {...props}
    />
  )
}

/** Select */
export function Select({ children, ...props }) {
  return (
    <select
      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
      {...props}
    >
      {children}
    </select>
  )
}

/** Primary button */
export function Btn({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    danger:  'bg-red-600/80 hover:bg-red-500 text-white',
    ghost:   'bg-slate-700 hover:bg-slate-600 text-slate-200',
  }
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Empty state placeholder */
export function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-slate-300 font-medium">{title}</p>
      {sub && <p className="text-slate-500 text-sm mt-1">{sub}</p>}
    </div>
  )
}

/** Progress bar */
export function ProgressBar({ pct, color = 'bg-indigo-500' }) {
  const clamped = Math.min(pct, 100)
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : color
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/** Type badge: income / expense */
export function TypeBadge({ type }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      type === 'income'
        ? 'bg-green-500/15 text-green-400'
        : 'bg-red-500/15 text-red-400'
    }`}>
      {type}
    </span>
  )
}

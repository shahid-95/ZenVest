import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { getBudgets, addBudget, updateBudget, deleteBudget } from '../services/api'
import { Modal, Field, Input, Select, Btn, ProgressBar, EmptyState } from '../components/UI'
import { formatINR, currentMonth, formatMonth, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../utils'

const EMPTY = { category: 'Food', limit: '', month: currentMonth() }

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [month, setMonth]     = useState(currentMonth())
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)

  useEffect(() => { load() }, [month])
  async function load() { setBudgets(await getBudgets(month)) }

  function openAdd()   { setForm({ ...EMPTY, month }); setEditing(null); setModal(true) }
  function openEdit(b) { setForm({ category: b.category, limit: b.limit, month: b.month }); setEditing(b.id); setModal(true) }

  async function handleSave() {
    if (!form.limit) return
    if (editing) {
      await updateBudget(editing, { limit: parseFloat(form.limit) })
    } else {
      await addBudget({ ...form, limit: parseFloat(form.limit) })
    }
    await load(); setModal(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this budget?')) return
    await deleteBudget(id); await load()
  }

  const totalBudget  = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent   = budgets.reduce((s, b) => s + b.spent, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{formatMonth(month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
          />
          <Btn onClick={openAdd} className="flex items-center gap-2"><Plus size={16} /> Add</Btn>
        </div>
      </div>

      {/* Overview bar */}
      {budgets.length > 0 && (
        <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex justify-between mb-2">
            <p className="text-slate-600 dark:text-slate-300 text-sm">Total Budget Used</p>
            <p className="text-slate-900 dark:text-white text-sm font-semibold">
              {formatINR(totalSpent)} / {formatINR(totalBudget)}
            </p>
          </div>
          <ProgressBar pct={(totalSpent / totalBudget) * 100} color="bg-indigo-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
            {formatINR(totalBudget - totalSpent)} remaining across all categories
          </p>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <EmptyState icon="🎯" title="No budgets set" sub="Add a budget to track your spending by category" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => (
            <div key={b.id} className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CATEGORY_ICONS[b.category] || '📦'}</span>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">{b.category}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Budget: {formatINR(b.limit)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <ProgressBar pct={b.percentage} />

              <div className="flex justify-between mt-3 text-sm">
                <span className={b.percentage >= 100 ? 'text-rose-600 dark:text-red-400 font-medium' : b.percentage >= 80 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-500 dark:text-slate-400'}>
                  {b.percentage}% used
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  <span className="text-slate-900 dark:text-white font-medium">{formatINR(b.spent)}</span>
                  {' '}spent
                </span>
              </div>

              {b.percentage >= 100 && (
                <div className="mt-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 text-rose-600 dark:text-red-400 text-xs font-medium">
                  ⚠️ Over budget by {formatINR(b.spent - b.limit)}
                </div>
              )}
              {b.percentage >= 80 && b.percentage < 100 && (
                <div className="mt-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  ⚡ Only {formatINR(b.remaining)} remaining
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Edit Budget Limit' : 'Set Budget'} onClose={() => setModal(false)}>
          <div className="space-y-4 text-left">
            {!editing && (
              <Field label="Category" className="text-slate-700 dark:text-slate-300">
                <Select 
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                      {CATEGORY_ICONS[c] || '📦'} {c}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            
            <Field label="Monthly Limit (₹)" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="number" 
                min="1" 
                value={form.limit}
                onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                placeholder="e.g. 5000" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {!editing && (
              <Field label="Month" className="text-slate-700 dark:text-slate-300">
                <Input 
                  type="month" 
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))} 
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </Field>
            )}
            
            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-2">
              <Btn variant="ghost" onClick={() => setModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-0">
                Cancel
              </Btn>
              <Btn onClick={handleSave} className="flex-1">
                {editing ? 'Update' : 'Save'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
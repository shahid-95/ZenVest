import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import {
  getTransactions, addTransaction, updateTransaction, deleteTransaction
} from '../services/api'
import {
  Modal, Field, Input, Select, Btn, TypeBadge, EmptyState
} from '../components/UI'
import {
  formatINR, formatDate, currentMonth,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_ICONS
} from '../utils'

const EMPTY = { type: 'expense', category: 'Food', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')   // all | income | expense
  const [month, setMonth]     = useState(currentMonth())
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [month, filter])

  async function load() {
    const data = await getTransactions(month, filter === 'all' ? null : filter)
    setTransactions(data)
  }

  function openAdd()   { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(t) { setForm({ ...t }); setEditing(t.id); setModal(true) }
  function close()     { setModal(false) }

  async function handleSave() {
    if (!form.amount || !form.description) return
    setLoading(true)
    try {
      if (editing) {
        await updateTransaction(editing, form)
      } else {
        await addTransaction(form)
      }
      await load()
      close()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    await deleteTransaction(id)
    await load()
  }

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{filtered.length} records</p>
        </div>
        <Btn onClick={openAdd} className="flex items-center gap-2">
          <Plus size={16} /> Add
        </Btn>
      </div>

      {/* Filters */}
      <div className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap gap-3 items-center shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex-1 min-w-[180px] focus-within:ring-2 focus-within:ring-indigo-500/20">
          <Search size={14} className="text-slate-400 dark:text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-slate-900 dark:text-white text-sm flex-1 outline-none placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        {/* Month picker */}
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
        />
        
        {/* Type filter */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                filter === f 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState icon="💳" title="No transactions found" sub="Add your first transaction above" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/20">
                  <th className="text-left px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Date</th>
                  <th className="text-left px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Description</th>
                  <th className="text-left px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Category</th>
                  <th className="text-left px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Type</th>
                  <th className="text-right px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Amount</th>
                  <th className="text-right px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-5 py-3.5 text-slate-900 dark:text-white font-medium">{t.description}</td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{CATEGORY_ICONS[t.category] || '📦'}</span>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><TypeBadge type={t.type} /></td>
                    <td className={`px-5 py-3.5 text-right font-semibold font-mono-nums ${
                      t.type === 'income' ? 'text-emerald-600 dark:text-green-400' : 'text-rose-600 dark:text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={close}>
          <div className="space-y-4 text-left">
            
            {/* Type Selector */}
            <Field label="Type" className="text-slate-700 dark:text-slate-300">
              <Select 
                value={form.type} 
                onChange={e => setForm(f => ({ ...f, type: e.target.value, category: e.target.value === 'income' ? 'Salary' : 'Food' }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="expense" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Expense</option>
                <option value="income" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Income</option>
              </Select>
            </Field>

            {/* Category Selector */}
            <Field label="Category" className="text-slate-700 dark:text-slate-300">
              <Select 
                value={form.category} 
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              >
                {categories.map(c => (
                  <option key={c} value={c} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                    {CATEGORY_ICONS[c] || '📦'} {c}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Amount Input */}
            <Field label="Amount (₹)" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || '' }))}
                placeholder="0.00" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {/* Description Input */}
            <Field label="Description" className="text-slate-700 dark:text-slate-300">
              <Input 
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Grocery shopping" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {/* Date Input */}
            <Field label="Date" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="date" 
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-2">
              <Btn variant="ghost" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-0">
                Cancel
              </Btn>
              <Btn onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Saving…' : editing ? 'Update' : 'Add'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
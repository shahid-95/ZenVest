import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, PlusCircle } from 'lucide-react'
import { getGoals, addGoal, updateGoal, deleteGoal } from '../services/api'
import { Modal, Field, Input, Btn, ProgressBar, EmptyState } from '../components/UI'
import { formatINR, formatDate } from '../utils'

const EMPTY = { name: '', target: '', saved: '0', deadline: '' }

export default function Goals() {
  const [goals, setGoals]     = useState([])
  const [modal, setModal]     = useState(false)
  const [addModal, setAddModal] = useState(null) // goal id for "add savings"
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [addAmount, setAddAmount] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const data = await getGoals()
    setTransactionsOrGoals(data)
  }

  // Wrapper function to match API structure smoothly
  function setTransactionsOrGoals(data) {
    setGoals(data)
  }

  function openAdd()   { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(g) { setForm({ name: g.name, target: g.target, saved: g.saved, deadline: g.deadline || '' }); setEditing(g.id); setModal(true) }

  async function handleSave() {
    if (!form.name || !form.target) return
    const payload = { name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, deadline: form.deadline || null }
    if (editing) { await updateGoal(editing, payload) }
    else { await addGoal(payload) }
    await load(); setModal(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return
    await deleteGoal(id); await load()
  }

  async function handleAddSavings(goalId, currentSaved) {
    const extra = parseFloat(addAmount)
    if (!extra || extra <= 0) return
    await updateGoal(goalId, { saved: currentSaved + extra })
    await load(); setAddModal(null); setAddAmount('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{goals.length} active goals</p>
        </div>
        <Btn onClick={openAdd} className="flex items-center gap-2"><Plus size={16} /> New Goal</Btn>
      </div>

      {/* Goals Content */}
      {goals.length === 0 ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <EmptyState icon="🎯" title="No goals yet" sub="Set a savings goal and track your progress" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const done = g.percentage >= 100
            return (
              <div 
                key={g.id} 
                className={`card p-5 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all hover:shadow-md ${
                  done 
                    ? 'border-green-500/40 dark:border-green-500/30' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{done ? '🎉' : '🎯'}</span>
                    <p className="text-slate-900 dark:text-white font-semibold">{g.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(g)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {g.deadline && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">🗓 Deadline: {formatDate(g.deadline)}</p>
                )}

                {/* Progress Visual */}
                <div className="my-4 text-center">
                  <p className="font-display font-bold text-3xl text-indigo-600 dark:text-indigo-400">
                    {g.percentage.toFixed(0)}%
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(g.saved)}</span> of {formatINR(g.target)}
                  </p>
                </div>

                <ProgressBar pct={g.percentage} color={done ? 'bg-green-500' : 'bg-indigo-500'} />

                <div className="flex justify-between items-center mt-4">
                  <p className={`text-xs font-medium ${done ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                    {done ? '✅ Goal reached!' : `${formatINR(g.target - g.saved)} to go`}
                  </p>
                  {!done && (
                    <button
                      onClick={() => { setAddModal(g.id); setAddAmount('') }}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
                    >
                      <PlusCircle size={13} /> Add savings
                    </button>
                  )}
                </div>

                {/* Inline Add Savings Panel */}
                {addModal === g.id && (
                  <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <input
                      type="number" 
                      min="1" 
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      placeholder="₹ amount"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Btn onClick={() => handleAddSavings(g.id, g.saved)} className="py-1.5 text-xs px-3">Add</Btn>
                    <Btn 
                      variant="ghost" 
                      onClick={() => setAddModal(null)} 
                      className="py-1.5 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-0"
                    >
                      ✕
                    </Btn>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Edit Goal' : 'New Goal'} onClose={() => setModal(false)}>
          <div className="space-y-4 text-left">
            <Field label="Goal Name" className="text-slate-700 dark:text-slate-300">
              <Input 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                placeholder="e.g. Emergency Fund" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            <Field label="Target Amount (₹)" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="number" 
                min="1" 
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))} 
                placeholder="100000" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            <Field label="Already Saved (₹)" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="number" 
                min="0" 
                value={form.saved}
                onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} 
                placeholder="0" 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            <Field label="Deadline (optional)" className="text-slate-700 dark:text-slate-300">
              <Input 
                type="date" 
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} 
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
              />
            </Field>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-2">
              <Btn 
                variant="ghost" 
                onClick={() => setModal(false)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-0"
              >
                Cancel
              </Btn>
              <Btn onClick={handleSave} className="flex-1">
                {editing ? 'Update' : 'Create'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
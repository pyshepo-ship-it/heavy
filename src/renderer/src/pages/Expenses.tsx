import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, X, Edit3, Inbox } from 'lucide-react'
import type { Expense, Equipment } from '@shared/types'

const categories = ['وقود', 'صيانة', 'قطع غيار', 'عمالة', 'تأمين', 'إيجار', 'نقل', 'إدارية', 'أخرى']

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({
    equipment_id: null as number | null, category: 'وقود', description: '',
    amount: 0, date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')

  const fetchAll = async () => {
    const [e, eq] = await Promise.all([window.api.getExpenses(), window.api.getEquipment()])
    setExpenses(e)
    setEquipmentList(eq)
  }

  useEffect(() => { fetchAll(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const filtered = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      await window.api.deleteExpense(id)
      fetchAll()
    }
  }

  const openEdit = (exp: Expense) => {
    setEditing(exp.id)
    setForm({
      equipment_id: exp.equipment_id, category: exp.category, description: exp.description,
      amount: exp.amount, date: exp.date, notes: exp.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateExpense(editing, form)
    } else {
      await window.api.createExpense(form)
    }
    setShowModal(false)
    setEditing(null)
    fetchAll()
  }

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المصروفات</h1>
          <p className="text-slate-500 dark:text-slate-400">تتبع جميع مصروفات العمل</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {editing ? 'تحديث' : 'إضافة مصروف'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="بحث في المصروفات..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <div className="card px-4 py-2">
          <span className="text-sm text-slate-500">الإجمالي: </span>
          <span className="font-bold text-red-500">{currency} {totalExpenses.toLocaleString('ar-EG')}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">الفئة</th>
                <th className="px-4 py-3 text-right">الوصف</th>
                <th className="px-4 py-3 text-right">المعدة</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="table-row">
                  <td className="px-4 py-3 text-sm">{exp.date}</td>
                  <td className="px-4 py-3"><span className="badge badge-yellow">{exp.category}</span></td>
                  <td className="px-4 py-3">{exp.description}</td>
                  <td className="px-4 py-3 text-slate-500">{equipmentList.find((e) => e.id === exp.equipment_id)?.name || '-'}</td>
                  <td className="px-4 py-3 font-medium text-red-500">{currency} {exp.amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 text-left">
                    <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
{filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Inbox className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد مصروفات</p>
                    <p className="text-slate-300 text-sm mt-1">اضغط "إضافة مصروف" لبدء التتبع</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editing ? 'تحديث مصروف' : 'إضافة مصروف جديد'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">الفئة</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select-field">
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">التاريخ</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المعدة (اختياري)</label>
                  <select value={form.equipment_id || ''} onChange={(e) => setForm({ ...form, equipment_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">عام / بدون معدة محددة</option>
                    {equipmentList.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="تغيير زيت، ديزل..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ({currency})</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={!form.description || !form.amount}>{editing ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

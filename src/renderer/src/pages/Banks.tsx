import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import type { Bank } from '@shared/types'

export default function Banks() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Bank | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'bank' as 'bank' | 'cashbox', account_number: '', balance: 0, notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')

  const fetchBanks = async () => {
    const data = await window.api.getBanks()
    setBanks(data)
  }

  useEffect(() => { fetchBanks(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const filtered = banks.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.account_number.includes(search)
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', type: 'bank', account_number: '', balance: 0, notes: '' })
    setShowModal(true)
  }

  const openEdit = (bank: Bank) => {
    setEditing(bank)
    setForm({
      name: bank.name, type: bank.type, account_number: bank.account_number,
      balance: bank.balance, notes: bank.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateBank(editing.id, form)
    } else {
      await window.api.createBank(form)
    }
    setShowModal(false)
    fetchBanks()
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا البنك/الخزينة؟')) {
      await window.api.deleteBank(id)
      fetchBanks()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">البنوك والخزائن</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة الحسابات البنكية والخزائن</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة حساب
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في البنوك..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">رقم الحساب</th>
                <th className="px-4 py-3 text-right">الرصيد</th>
                <th className="px-4 py-3 text-right">ملاحظات</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bank) => (
                <tr key={bank.id} className="table-row">
                  <td className="px-4 py-3 font-medium">{bank.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${bank.type === 'bank' ? 'badge-blue' : 'badge-green'}`}>
                      {bank.type === 'bank' ? 'بنك' : 'خزينة'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{bank.account_number}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${bank.balance > 0 ? 'text-green-500' : bank.balance < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {currency} {bank.balance.toLocaleString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{bank.notes}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(bank)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(bank.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">لا توجد بنوك أو خزائن</td></tr>
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
                <h2 className="text-lg font-bold">{editing ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="اسم البنك أو الخزينة" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'bank' | 'cashbox' })} className="select-field">
                    <option value="bank">بنك</option>
                    <option value="cashbox">خزينة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم الحساب</label>
                  <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="input-field" placeholder="رقم الحساب" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الرصيد ($)</label>
                  <input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={!form.name}>{editing ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, X, Edit3 } from 'lucide-react'
import type { PurchaseInvoice, Custody } from '@shared/types'

const statusColors: Record<string, string> = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  cancelled: 'badge-red'
}
const statusLabels: Record<string, string> = {
  pending: 'معلقة',
  paid: 'مدفوعة',
  cancelled: 'ملغية'
}

export default function Purchases() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [custodies, setCustodies] = useState<Custody[]>([])
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('ر.س')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({
    vendor_name: '', description: '', amount: 0, custody_id: null as number | null, status: 'pending' as 'pending' | 'paid' | 'cancelled', date: new Date().toISOString().slice(0, 10), notes: ''
  })

  useEffect(() => {
    Promise.all([
      window.api.getPurchaseInvoices(),
      window.api.getCustody()
    ]).then(([p, c]) => {
      setInvoices(p)
      setCustodies(c)
    })
    window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {})
  }, [])

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor_name.toLowerCase().includes(search.toLowerCase())
  )

  const getCustodyNumber = (id: number | null) => {
    if (!id) return null
    return custodies.find((c) => c.id === id)?.custody_number || null
  }

  const totalPurchases = filtered.reduce((sum, inv) => sum + inv.amount, 0)

  const openEdit = (inv: PurchaseInvoice) => {
    setEditing(inv.id)
    setForm({
      vendor_name: inv.vendor_name, description: inv.description, amount: inv.amount,
      custody_id: inv.custody_id, status: inv.status, date: inv.date, notes: inv.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updatePurchaseInvoice(editing, form)
    } else {
      await window.api.createPurchaseInvoice(form)
    }
    setShowModal(false)
    setEditing(null)
    fetchAll()
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      await window.api.deletePurchaseInvoice(id)
      fetchAll()
    }
  }

  const fetchAll = async () => {
    const [p, c] = await Promise.all([window.api.getPurchaseInvoices(), window.api.getCustody()])
    setInvoices(p)
    setCustodies(c)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">فواتير المشتريات</h1>
          <p className="text-slate-500 dark:text-slate-400">عرض وإدارة فواتير المشتريات</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditing(null); setForm({ vendor_name: '', description: '', amount: 0, custody_id: null, status: 'pending', date: new Date().toISOString().slice(0, 10), notes: '' }); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة فاتورة
          </button>
          <div className="card px-4 py-2">
            <span className="text-sm text-slate-500">إجمالي المشتريات: </span>
            <span className="font-bold text-red-500">{currency} {totalPurchases.toLocaleString('ar-EG')}</span>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في المشتريات..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right">المورد</th>
                <th className="px-4 py-3 text-right">الوصف</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-right">العهدة المرتبطة</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const custodyNumber = getCustodyNumber(inv.custody_id)
                return (
                  <tr key={inv.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium">{inv.vendor_name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{inv.description}</td>
                    <td className="px-4 py-3 font-medium text-red-500">{currency} {inv.amount.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-3">
                      {custodyNumber ? (
                        <span className="badge badge-purple">{custodyNumber}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{inv.date}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit3 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">لا توجد فواتير مشتريات</td></tr>
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
                <h2 className="text-lg font-bold">{editing ? 'تحديث فاتورة شراء' : 'إضافة فاتورة شراء'}</h2>
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم المورد</label>
                  <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} className="input-field" placeholder="اسم المورد" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="وصف الشراء" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ ({currency})</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">العهدة المرتبطة</label>
                    <select value={form.custody_id || ''} onChange={(e) => setForm({ ...form, custody_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                      <option value="">بدون عهدة</option>
                      {custodies.map((c) => <option key={c.id} value={c.id}>{c.custody_number}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'pending' | 'paid' | 'cancelled' })} className="select-field">
                      <option value="pending">معلقة</option>
                      <option value="paid">مدفوعة</option>
                      <option value="cancelled">ملغية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">التاريخ</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary">{editing ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

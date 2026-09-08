import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X, FileText, AlertTriangle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '@shared/types'

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return `0${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }
  return phone
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', company: '', address: '', credit_limit: 0, opening_balance: 0, current_balance: 0, notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')
  const [showStatement, setShowStatement] = useState(false)
  const navigate = useNavigate()

  const fetchClients = async () => {
    const data = await window.api.getClients()
    setClients(data)
  }

  const fetchInvoices = async () => {
    const data = await window.api.getInvoices()
    setInvoices(data)
  }

  useEffect(() => {
    fetchClients()
    fetchInvoices()
    window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {})
  }, [])

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const getInvoiceCount = (clientId: number) => invoices.filter((inv: any) => inv.client_id === clientId).length

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', phone: '', company: '', address: '', credit_limit: 0, opening_balance: 0, current_balance: 0, notes: '' })
    setShowModal(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({
      name: client.name, phone: client.phone, company: client.company, address: client.address,
      credit_limit: client.credit_limit, opening_balance: client.opening_balance,
      current_balance: client.current_balance, notes: client.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateClient(editing.id, form)
    } else {
      const newBalance = form.opening_balance
      await window.api.createClient({ ...form, current_balance: newBalance })
    }
    setShowModal(false)
    fetchClients()
    fetchInvoices()
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      await window.api.deleteClient(id)
      fetchClients()
      fetchInvoices()
    }
  }

  const getBalanceWarning = (client: Client) => {
    if (client.credit_limit > 0 && client.current_balance > client.credit_limit) {
      return true
    }
    return false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">العملاء</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة العملاء والمقاولين</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة عميل
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في العملاء..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الهاتف</th>
                <th className="px-4 py-3 text-right">الشركة</th>
                <th className="px-4 py-3 text-right">حد الائتمان</th>
                <th className="px-4 py-3 text-right">الرصيد</th>
                <th className="px-4 py-3 text-right">عدد الفواتير</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const invoiceCount = getInvoiceCount(client.id)
                const balanceWarning = getBalanceWarning(client)
                return (
                  <tr key={client.id} className="table-row">
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatPhone(client.phone)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{client.company}</td>
                    <td className="px-4 py-3">{currency} {client.credit_limit.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-3">
                      <span className={client.current_balance > 0 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                        {currency} {client.current_balance.toLocaleString('ar-EG')}
                      </span>
                      {balanceWarning && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-red-500 text-xs">تجاوز الحد</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate('/invoices')} className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                        <FileText className="w-3.5 h-3.5" /> {invoiceCount} فاتورة
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => window.open("/customer-statement?client=" + client.id, "_self")} title="كشف الحساب" className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                          <FileText className="w-4 h-4 text-green-600" />
                        </button>
                        <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا يوجد عملاء</p>
                    <p className="text-slate-300 text-sm mt-1">اضغط "إضافة عميل" لبدء الإضافة</p>
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
                <h2 className="text-lg font-bold">{editing ? 'تعديل العميل' : 'إضافة عميل جديد'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="اسم العميل" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الهاتف</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="05XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الشركة</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field" placeholder="اسم الشركة" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">العنوان</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">حد الائتمان ({currency})</label>
                  <input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الرصيد الافتتاحي ({currency})</label>
                  <input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })} className="input-field" />
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
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Banknote, ArrowDownCircle, ArrowUpCircle, Download, Pencil, Trash2 } from 'lucide-react'
import type { Client, Equipment, Bank, Invoice } from '@shared/types'
import { exportToExcelXLSX } from '../lib/exportExcel'

const statusLabels: Record<string, string> = { confirmed: 'مؤكد', cancelled: 'ملغى' }

export default function Vouchers() {
  const [type, setType] = useState<'pay' | 'receive'>('pay')
  const [vouchers, setVouchers] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [currency, setCurrency] = useState('ر.س')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({
    voucher_type: 'pay' as 'pay' | 'receive',
    client_id: null as number | null,
    equipment_id: null as number | null,
    invoice_id: null as number | null,
    bank_id: null as number | null,
    amount: 0,
    method: 'cash' as 'cash' | 'bank',
    date: new Date().toISOString().slice(0, 10),
    beneficiary: '',
    description: ''
  })

  const fetchAll = async () => {
    const [v, c, e, b, i] = await Promise.all([
      window.api.getVouchers(),
      window.api.getClients(),
      window.api.getEquipment(),
      window.api.getBanks(),
      window.api.getInvoices()
    ])
    setVouchers(v)
    setClients(c)
    setEquipment(e)
    setBanks(b)
    setInvoices(i)
  }

  useEffect(() => {
    fetchAll()
    window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {})
  }, [])

  const filtered = vouchers.filter((v) => {
    if (v.voucher_type !== type) return false
    const q = search.toLowerCase()
    return (v.voucher_number || '').toLowerCase().includes(q) ||
      (v.client_name || '').toLowerCase().includes(q) ||
      (v.equipment_name || '').toLowerCase().includes(q) ||
      (v.beneficiary || '').toLowerCase().includes(q)
  })

  const periodFiltered = filtered.filter((v) => {
    const end = new Date(dateTo + 'T23:59:59')
    const d = new Date(v.date + 'T00:00:00')
    return d >= new Date(dateFrom + 'T00:00:00') && d <= end
  })

  const totalAmount = periodFiltered.filter((v) => v.status !== 'cancelled').reduce((s, v) => s + (Number(v.amount) || 0), 0)

  const openAdd = () => {
    setEditing(null)
    setForm({ voucher_type: type, client_id: null, equipment_id: null, invoice_id: null, bank_id: null, amount: 0, method: 'cash', date: new Date().toISOString().slice(0, 10), beneficiary: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (v: any) => {
    setEditing(v)
    setForm({
      voucher_type: v.voucher_type, client_id: v.client_id, equipment_id: v.equipment_id,
      invoice_id: v.invoice_id, bank_id: v.bank_id, amount: v.amount, method: v.method,
      date: v.date, beneficiary: v.beneficiary || '', description: v.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateVoucher(editing.id, form)
    } else {
      await window.api.createVoucher(form)
    }
    setShowModal(false)
    setEditing(null)
    fetchAll()
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السند؟')) {
      await window.api.deleteVoucher(id)
      fetchAll()
    }
  }

  const handleExport = () => {
    exportToExcelXLSX(
      periodFiltered.map((v) => ({
        no: v.voucher_number,
        client: v.client_name || '',
        equipment: v.equipment_name || '',
        bank: v.bank_name || '',
        beneficiary: v.beneficiary || '',
        amount: v.amount,
        method: v.method === 'cash' ? 'نقدي' : 'بنكي',
        date: v.date,
        status: statusLabels[v.status] || v.status,
        desc: v.description || ''
      })),
      (type === 'pay' ? 'سندات_صرف' : 'سندات_قبض') + '_' + dateFrom + '_' + dateTo,
      [
        { key: 'no', label: 'رقم السند' },
        { key: 'client', label: 'العميل' },
        { key: 'equipment', label: 'المعدة' },
        { key: 'bank', label: 'الخزينة' },
        { key: 'beneficiary', label: 'المستفيد' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'method', label: 'الطريقة' },
        { key: 'date', label: 'التاريخ' },
        { key: 'status', label: 'الحالة' },
        { key: 'desc', label: 'البيان' },
      ]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-6 h-6" /> السندات المحاسبية
          </h1>
          <p className="text-slate-500 dark:text-slate-400">سندات الصرف والقبض مع ربطها بالعملاء والمعدات والفواتير</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> سند جديد
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <button onClick={() => setType('pay')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${type === 'pay' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>
            <ArrowUpCircle className="w-4 h-4" /> سندات صرف
          </button>
          <button onClick={() => setType('receive')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${type === 'receive' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>
            <ArrowDownCircle className="w-4 h-4" /> سندات قبض
          </button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-40" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-40" />
        <div className="card px-4 py-2">
          <span className="text-sm text-slate-500">الإجمالي: </span>
          <span className={`font-bold ${type === 'pay' ? 'text-red-600' : 'text-green-600'}`}>{currency} {totalAmount.toLocaleString('ar-EG')}</span>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> تصدير Excel
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">رقم السند</th>
                <th className="px-4 py-3 text-right">العميل</th>
                <th className="px-4 py-3 text-right">المعدة</th>
                <th className="px-4 py-3 text-right">الخزينة</th>
                <th className="px-4 py-3 text-right">المستفيد</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-right">الطريقة</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {periodFiltered.map((v) => (
                <tr key={v.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-sm">{v.voucher_number}</td>
                  <td className="px-4 py-3">{v.client_name || '-'}</td>
                  <td className="px-4 py-3">{v.equipment_name ? `${v.equipment_name} (${v.equipment_code})` : '-'}</td>
                  <td className="px-4 py-3">{v.bank_name || '-'}</td>
                  <td className="px-4 py-3">{v.beneficiary || '-'}</td>
                  <td className={`px-4 py-3 font-bold ${type === 'pay' ? 'text-red-600' : 'text-green-600'}`}>{currency} {(Number(v.amount) || 0).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">{v.method === 'cash' ? 'نقدي' : 'بنكي'}</td>
                  <td className="px-4 py-3 text-sm">{v.date}</td>
                  <td className="px-4 py-3"><span className={`badge ${v.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>{statusLabels[v.status]}</span></td>
                  <td className="px-4 py-3 text-left">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><Pencil className="w-4 h-4 text-blue-500" /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              ))}
              {periodFiltered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">لا توجد سندات في الفترة المحددة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl mx-4 card p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editing ? 'تعديل سند' : form.voucher_type === 'pay' ? 'سند صرف جديد' : 'سند قبض جديد'}</h2>
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع السند</label>
                  <select value={form.voucher_type} onChange={(e) => setForm({ ...form, voucher_type: e.target.value as any })} className="select-field">
                    <option value="pay">سند صرف</option>
                    <option value="receive">سند قبض</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الخزينة/البنك</label>
                  <select value={form.bank_id || ''} onChange={(e) => setForm({ ...form, bank_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">بدون</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الطريقة</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })} className="select-field">
                    <option value="cash">نقدي</option>
                    <option value="bank">بنكي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">العميل (للربط عند الحاجة)</label>
                  <select value={form.client_id || ''} onChange={(e) => setForm({ ...form, client_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">بدون</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المعدة (لإيراد/مصروف المعدة)</label>
                  <select value={form.equipment_id || ''} onChange={(e) => setForm({ ...form, equipment_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">عام</option>
                    {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">فاتورة مرتبطة (اختياري)</label>
                  <select value={form.invoice_id || ''} onChange={(e) => setForm({ ...form, invoice_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">بدون</option>
                    {invoices.map((iv) => <option key={iv.id} value={iv.id}>{iv.invoice_number} - {iv.total_amount}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ({currency})</label>
                  <input type="number" min="0" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">المستفيد / الدافع</label>
                  <input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} className="input-field" placeholder="اسم الجهة" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-sm font-medium mb-1">البيان</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="تفاصيل السند" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={!form.amount || !form.date}>{editing ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, X, Pencil, Printer, Copy, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Invoice, Client, Equipment, RentalContract, AppSettings } from '@shared/types'
import { renderInvoiceTemplate, type TemplateName } from '../lib/invoiceTemplates'

const statusColors: Record<string, string> = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  partial: 'badge-blue',
  cancelled: 'badge-red'
}
const statusLabels: Record<string, string> = {
  pending: 'معلقة',
  paid: 'مدفوعة',
  partial: 'جزئية',
  cancelled: 'ملغاة'
}
const typeLabels: Record<string, string> = {
  rental: 'تأجير',
  direct: 'مباشرة',
  expense: 'مصروف'
}

type LineItem = {
  equipment_id: number | null
  description: string
  qty: number
  unit_price: number
  amount: number
  notes: string
}

const emptyForm = {
  client_id: 0,
  contract_id: null as number | null,
  equipment_id: null as number | null,
  type: 'rental' as 'rental' | 'direct' | 'expense',
  status: 'pending' as 'pending' | 'paid' | 'partial' | 'cancelled',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  notes: '',
  vat_rate: 15
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [search, setSearch] = useState('')
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [form, setForm] = useState(emptyForm)

  const navigate = useNavigate()

  const fetchData = async () => {
    const [i, c, e, co, s] = await Promise.all([
      window.api.getInvoices(),
      window.api.getClients(),
      window.api.getEquipment(),
      window.api.getContracts(),
      window.api.getSettings()
    ])
    setInvoices(i)
    setClients(c)
    setEquipment(e)
    setContracts(co)
    if (s) setSettings(s)
    const sortedInvoices = [...i].sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5)
    setRecentInvoices(sortedInvoices)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = invoices.filter((inv) => {
    const clientName = clients.find((c) => c.id === inv.client_id)?.name || ''
    return (
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getClientName = (id: number) => clients.find((c) => c.id === id)?.name || '-'
  const getEquipmentName = (id: number | null) => id ? equipment.find((e) => e.id === id)?.name || '-' : '-'
  const getClientBalance = (id: number) => clients.find((c) => c.id === id)?.current_balance ?? 0

  const clientContracts = contracts.filter(
    (c) => c.client_id === form.client_id && c.status === 'active'
  )

  const currency = settings?.currency ?? 'ر.س'

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const vatAmount = subtotal * (Number(form.vat_rate) || 0) / 100
  const total = subtotal + vatAmount

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm, vat_rate: settings?.vat_rate ?? 15 })
    setLineItems([{ equipment_id: null, description: '', qty: 1, unit_price: 0, amount: 0, notes: '' }])
    setShowModal(true)
  }

  const openEdit = async (inv: Invoice) => {
    setEditingId(inv.id)
    setForm({
      client_id: inv.client_id,
      contract_id: inv.contract_id,
      equipment_id: inv.equipment_id,
      type: inv.type,
      status: inv.status,
      date: inv.created_at ? inv.created_at.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0],
      due_date: inv.due_date || '',
      notes: inv.notes || '',
      vat_rate: inv.vat_rate ?? 15
    })
    const items = await window.api.getInvoiceItems(inv.id)
    setLineItems(items.map((r: any) => ({
      equipment_id: r.equipment_id,
      description: r.description,
      qty: r.qty,
      unit_price: r.unit_price,
      amount: r.amount,
      notes: r.notes || ''
    })))
    setShowModal(true)
  }

  const handleClientChange = (clientId: number) => {
    setForm({ ...form, client_id: clientId, contract_id: null, equipment_id: null })
  }

  const handleContractChange = (contractId: number) => {
    const contract = contracts.find((c) => c.id === contractId)
    if (!contract) {
      setForm({ ...form, contract_id: null })
      return
    }
    const equip = equipment.find((e) => e.id === contract.equipment_id)
    setForm({ ...form, contract_id: contractId, equipment_id: contract.equipment_id })
    setLineItems([{
      equipment_id: contract.equipment_id,
      description: equip ? equip.name + ' - ' + contract.contract_number : contract.contract_number,
      qty: 1,
      unit_price: contract.unit_price,
      amount: contract.unit_price,
      notes: ''
    }])
  }

  const addLineItem = () => {
    setLineItems([...lineItems, {
      equipment_id: null, description: '', qty: 1, unit_price: 0, amount: 0, notes: ''
    }])
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number | null) => {
    setLineItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === 'qty' || field === 'unit_price') {
        updated.amount = (Number(updated.qty) || 0) * (Number(updated.unit_price) || 0)
      }
      if (field === 'equipment_id') {
        const equip = equipment.find((e) => e.id === value)
        if (equip && !updated.description) {
          updated.description = equip.name
        }
      }
      return updated
    }))
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const header = {
      client_id: form.client_id,
      contract_id: form.contract_id,
      equipment_id: form.equipment_id,
      type: form.type,
      amount: subtotal,
      tax_amount: vatAmount,
      vat_rate: Number(form.vat_rate) || 0,
      total_before_vat: subtotal,
      total_amount: total,
      status: form.status,
      due_date: form.due_date,
      notes: form.notes
    }
    if (editingId) {
      await window.api.updateInvoice(editingId, header)
      const old = await window.api.getInvoiceItems(editingId)
      for (const r of old) {
        await window.api.deleteInvoiceItem(r.id)
      }
      for (const item of lineItems) {
        await window.api.createInvoiceItem({ invoice_id: editingId, ...item })
      }
    } else {
      const invoiceId = await window.api.createInvoice(header)
      for (const item of lineItems) {
        await window.api.createInvoiceItem({ invoice_id: invoiceId, ...item })
      }
    }
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      await window.api.deleteInvoice(id)
      fetchData()
    }
  }

  const copyInvoiceNumber = (invoiceNumber: string) => {
    navigator.clipboard.writeText(invoiceNumber)
  }

  const handlePrint = async (inv: Invoice) => {
    const items = await window.api.getInvoiceItems(inv.id)
    const client = clients.find((c) => c.id === inv.client_id)
    let template: TemplateName = 'modern'
    try {
      const ps = settings?.print_settings ? JSON.parse(settings.print_settings) : null
      if (ps && ps.template) template = ps.template as TemplateName
    } catch { /* keep default */ }
    const html = renderInvoiceTemplate(template, {
      invoiceNumber: inv.invoice_number,
      issueDate: inv.created_at ? inv.created_at.split('T')[0].split(' ')[0] : '',
      clientName: client?.name || '-',
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',
      companyName: settings?.company_name || '',
      taxNumber: settings?.tax_number || '',
      items: items.map((r: any) => ({
        description: r.description,
        qty: r.qty,
        unitPrice: r.unit_price,
        amount: r.amount
      })),
      deductions: [],
      subtotal: inv.total_before_vat ?? inv.amount,
      vatRate: inv.vat_rate ?? 0,
      vatAmount: inv.tax_amount,
      deductionsTotal: 0,
      total: inv.total_amount,
      currency: settings?.currency ?? 'ر.س',
      notes: inv.notes || ''
    })
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الفواتير</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة فواتير العملاء</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في الفواتير..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right">العميل</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">قبل الضريبة</th>
                <th className="px-4 py-3 text-right">الضريبة</th>
                <th className="px-4 py-3 text-right">الإجمالي</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-sm">
                    <div className="flex items-center gap-1">
                      <span>{inv.invoice_number}</span>
                      <button onClick={() => copyInvoiceNumber(inv.invoice_number)} title="نسخ رقم الفاتورة" className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getClientName(inv.client_id)}</td>
                  <td className="px-4 py-3">{typeLabels[inv.type] || inv.type}</td>
                  <td className="px-4 py-3">{currency} {(inv.total_before_vat ?? inv.amount).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">{currency} {inv.tax_amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 font-medium">{currency} {inv.total_amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(inv)} title="تعديل" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handlePrint(inv)} title="طباعة" className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Printer className="w-4 h-4 text-green-500" />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} title="حذف" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد فواتير</p>
                    <p className="text-slate-300 text-sm mt-1">اضغط "فاتورة جديدة" لبدء الإضافة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Count Indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">إجمالي الفواتير: <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span></span>
        <span className="text-sm text-slate-500">عدد البنود في الفاتورة الحالية: <span className="font-bold text-brand-600">{lineItems.length}</span> بند</span>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-4xl mx-4 card p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editingId ? 'تعديل الفاتورة' : 'فاتورة جديدة'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">العميل *</label>
                  <select value={form.client_id || ''} onChange={(e) => handleClientChange(Number(e.target.value))} className="select-field">
                    <option value="">اختر العميل</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (رصيد: {currency} {getClientBalance(c.id).toLocaleString('ar-EG')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">العقد (اختياري)</label>
                  <select value={form.contract_id || ''} onChange={(e) => handleContractChange(Number(e.target.value))} className="select-field" disabled={!form.client_id}>
                    <option value="">بدون عقد</option>
                    {clientContracts.map((c) => <option key={c.id} value={c.id}>{c.contract_number} - {getEquipmentName(c.equipment_id)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع الفاتورة</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="select-field">
                    <option value="rental">تأجير</option>
                    <option value="direct">مباشرة</option>
                    <option value="expense">مصروف</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="select-field">
                    <option value="pending">معلقة</option>
                    <option value="paid">مدفوعة</option>
                    <option value="partial">جزئية</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نسبة الضريبة %</label>
                  <input type="number" min="0" max="100" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">البنود</h3>
                <button onClick={addLineItem} className="btn-secondary flex items-center gap-1 text-sm">
                  <Plus className="w-3 h-3" /> إضافة بند
                </button>
              </div>
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-3 py-2 text-right">البيان</th>
                      <th className="px-3 py-2 text-right">الكمية</th>
                      <th className="px-3 py-2 text-right">سعر الوحدة</th>
                      <th className="px-3 py-2 text-right">المبلغ</th>
                      <th className="px-3 py-2 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="px-3 py-2">
                          <input value={item.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)} className="input-field text-sm" placeholder="بيان البند" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="any" value={item.qty} onChange={(e) => updateLineItem(i, 'qty', Number(e.target.value))} className="input-field text-sm w-20" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="any" value={item.unit_price} onChange={(e) => updateLineItem(i, 'unit_price', Number(e.target.value))} className="input-field text-sm w-28" />
                        </td>
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{currency} {(Number(item.amount) || 0).toLocaleString('ar-EG')}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeLineItem(i)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">لا توجد بنود — أضف بنداً</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={5} placeholder="ملاحظات إضافية تظهر في الفاتورة..." />
                </div>
                <div className="card p-4 space-y-3 h-fit">
                  <div className="flex justify-between"><span className="text-slate-500">المجموع قبل الضريبة</span><span className="font-medium">{currency} {subtotal.toLocaleString('ar-EG')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">ضريبة القيمة المضافة ({Number(form.vat_rate) || 0}%)</span><span className="font-medium">{currency} {vatAmount.toLocaleString('ar-EG')}</span></div>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div className="flex justify-between text-lg font-bold"><span>الإجمالي المستحق</span><span>{currency} {total.toLocaleString('ar-EG')}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={!form.client_id || lineItems.length === 0}>
                  {editingId ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Invoices Panel */}
      {recentInvoices.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">آخر 5 فواتير</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-2 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-2 text-right">العميل</th>
                  <th className="px-4 py-2 text-right">الإجمالي</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/10" onClick={() => navigate('/invoices')}>
                    <td className="px-4 py-2 font-mono text-sm">{inv.invoice_number}</td>
                    <td className="px-4 py-2">{getClientName(inv.client_id)}</td>
                    <td className="px-4 py-2">{currency} {inv.total_amount.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-2"><span className={`badge ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
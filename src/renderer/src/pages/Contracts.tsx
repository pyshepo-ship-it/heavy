import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CheckCircle, XCircle } from 'lucide-react'
import type { RentalContract, Equipment, Client, Driver } from '@shared/types'

const statusColors: Record<string, string> = {
  active: 'badge-green',
  closed: 'badge-blue',
  cancelled: 'badge-red'
}
const statusLabels: Record<string, string> = {
  active: 'نشط',
  closed: 'مغلق',
  cancelled: 'ملغي'
}

export default function Contracts() {
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState<number | null>(null)
  const [meterEnd, setMeterEnd] = useState(0)
  const [form, setForm] = useState({
    client_id: 0, equipment_id: 0, driver_id: null as number | null,
    start_date: new Date().toISOString().split('T')[0], unit_price: 0, notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')

  const fetchAll = async () => {
    const [c, e, cl, d] = await Promise.all([
      window.api.getContracts(),
      window.api.getEquipment(),
      window.api.getClients(),
      window.api.getDrivers?.() ?? Promise.resolve([])
    ])
    setContracts(c)
    setEquipment(e)
    setClients(cl)
    setDrivers(d as Driver[])
  }

  useEffect(() => { fetchAll(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!form.client_id || !form.equipment_id) return
    await window.api.createContract(form)
    setShowModal(false)
    fetchAll()
  }

  const handleClose = async () => {
    if (showCloseModal === null) return
    await window.api.closeContract(showCloseModal, meterEnd)
    setShowCloseModal(null)
    fetchAll()
  }

  const handleCancel = async (id: number) => {
    if (confirm('هل أنت متأكد من إلغاء هذا العقد؟')) {
      await window.api.cancelContract(id)
      fetchAll()
    }
  }

  const getEquipmentName = (id: number) => equipment.find((e) => e.id === id)?.name || '-'
  const getClientName = (id: number) => clients.find((c) => c.id === id)?.name || '-'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">عقود التأجير</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة اتفاقيات تأجير المعدات</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> عقد جديد
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">رقم العقد</th>
                <th className="px-4 py-3 text-right">العميل</th>
                <th className="px-4 py-3 text-right">المعدة</th>
                <th className="px-4 py-3 text-right">تاريخ البدء</th>
                <th className="px-4 py-3 text-right">عداد البدء</th>
                <th className="px-4 py-3 text-right">عداد النهاية</th>
                <th className="px-4 py-3 text-right">المبلغ الإجمالي</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-sm">{c.contract_number}</td>
                  <td className="px-4 py-3">{getClientName(c.client_id)}</td>
                  <td className="px-4 py-3">{getEquipmentName(c.equipment_id)}</td>
                  <td className="px-4 py-3 text-sm">{c.start_date}</td>
                  <td className="px-4 py-3 font-mono">{c.meter_start.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 font-mono">{c.meter_end?.toLocaleString('ar-EG') || '-'}</td>
                  <td className="px-4 py-3 font-medium">{currency} {c.total_amount.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[c.status]}`}>{statusLabels[c.status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {c.status === 'active' && (
                        <>
                          <button onClick={() => { setShowCloseModal(c.id); setMeterEnd(c.meter_start) }} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="إغلاق">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button onClick={() => handleCancel(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="إلغاء">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">لا توجد عقود</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">عقد تأجير جديد</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">العميل</label>
                  <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر العميل...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المعدة</label>
                  <select value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر المعدة...</option>
                    {equipment.filter((e) => e.status === 'available').map((e) => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السائق (اختياري)</label>
                  <select value={form.driver_id || ''} onChange={(e) => setForm({ ...form, driver_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value="">بدون</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ البدء</label>
                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">سعر الوحدة ($)</label>
                    <input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreate} className="btn-primary" disabled={!form.client_id || !form.equipment_id}>إنشاء العقد</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Modal */}
      <AnimatePresence>
        {showCloseModal !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm mx-4 card p-6">
              <h2 className="text-lg font-bold mb-4">إغلاق العقد</h2>
              <div>
                <label className="block text-sm font-medium mb-1">قراءة العداد النهائية</label>
                <input type="number" value={meterEnd} onChange={(e) => setMeterEnd(Number(e.target.value))} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCloseModal(null)} className="btn-secondary">إلغاء</button>
                <button onClick={handleClose} className="btn-primary">إغلاق وإنشاء فاتورة</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

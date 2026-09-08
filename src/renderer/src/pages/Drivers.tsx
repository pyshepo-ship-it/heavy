import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X, Car } from 'lucide-react'
import type { Driver, Employee, Equipment } from '@shared/types'

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('ر.س')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', employee_id: null as number | null,
    daily_wage: 0, overtime_rate: 0, equipment_id: null as number | null, notes: ''
  })

  const fetchDrivers = async () => {
    const data = await window.api.getDrivers()
    setDrivers(data)
  }

  const fetchEmployees = async () => {
    const data = await window.api.getEmployees()
    setEmployees(data)
  }

  const fetchEquipment = async () => {
    const data = await window.api.getEquipment()
    setEquipment(data)
  }

  useEffect(() => { fetchDrivers(); fetchEmployees(); fetchEquipment(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', phone: '', employee_id: null, daily_wage: 0, overtime_rate: 0, equipment_id: null, notes: '' })
    setShowModal(true)
  }

  const openEdit = (drv: Driver) => {
    setEditing(drv)
    setForm({
      name: drv.name, phone: drv.phone, employee_id: drv.employee_id,
      daily_wage: drv.daily_wage, overtime_rate: drv.overtime_rate, equipment_id: drv.equipment_id, notes: drv.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateDriver(editing.id, form)
    } else {
      await window.api.createDriver(form)
    }
    setShowModal(false)
    fetchDrivers()
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السائق؟')) {
      await window.api.deleteDriver(id)
      fetchDrivers()
    }
  }

  const getEmployeeName = (id: number | null) => {
    return employees.find(e => e.id === id)?.name || '—'
  }

  const getEquipmentName = (id: number | null) => {
    return equipment.find(eq => eq.id === id)?.name || '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">السائقين</h1>
            <p className="text-slate-500 dark:text-slate-400">إدارة السائقين والأجور</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة سائق
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في السائقين..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الهاتف</th>
                <th className="px-4 py-3 text-right">الموظف المرتبط</th>
                <th className="px-4 py-3 text-right">الأجر اليومي</th>
                <th className="px-4 py-3 text-right">أجر إضافي</th>
                <th className="px-4 py-3 text-right">المعدة المرتبطة</th>
                <th className="px-4 py-3 text-right">ملاحظات</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((drv) => (
                <tr key={drv.id} className="table-row">
                  <td className="px-4 py-3 font-medium">{drv.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{drv.phone}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{getEmployeeName(drv.employee_id)}</td>
                  <td className="px-4 py-3 font-medium">‏{currency} {drv.daily_wage.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 font-medium">‏{currency} {drv.overtime_rate.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{getEquipmentName(drv.equipment_id)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{drv.notes}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(drv)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(drv.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">لا يوجد سائقين</td></tr>
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
                <h2 className="text-lg font-bold">{editing ? 'تعديل السائق' : 'إضافة سائق جديد'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="اسم السائق" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الهاتف</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="05XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الموظف المرتبط</label>
                  <select value={form.employee_id ?? ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value=''>— بدون —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الأجر اليومي ($)</label>
                  <input type="number" value={form.daily_wage} onChange={(e) => setForm({ ...form, daily_wage: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">أجر إضافي ($)</label>
                  <input type="number" value={form.overtime_rate} onChange={(e) => setForm({ ...form, overtime_rate: Number(e.target.value) })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">المعدة المرتبطة</label>
                  <select value={form.equipment_id ?? ''} onChange={(e) => setForm({ ...form, equipment_id: e.target.value ? Number(e.target.value) : null })} className="select-field">
                    <option value=''>— بدون —</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>
                    ))}
                  </select>
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
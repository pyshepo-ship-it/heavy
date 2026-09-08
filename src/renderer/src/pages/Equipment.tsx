import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEquipmentStore } from '../store/useEquipmentStore'
import { Plus, Edit, Trash2, Search, X, AlertTriangle, PackageOpen } from 'lucide-react'
import type { Equipment } from '@shared/types'

const equipmentTypes = ['حفار', 'لوادر', 'كرين', 'مولد', 'بلدوزر', 'كومانداتور', 'باكهو', 'فوركليفت', 'أخرى']
const statusColors: Record<string, string> = {
  available: 'badge-green',
  rented: 'badge-yellow',
  maintenance: 'badge-red'
}
const statusLabels: Record<string, string> = {
  available: 'متاحة',
  rented: 'مؤجرة',
  maintenance: 'صيانة'
}

export default function Equipment() {
  const { equipment, isLoading, fetchEquipment, addEquipment, updateEquipment, deleteEquipment } = useEquipmentStore()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'حفار', current_meter: 0,
    hourly_rate: 0, daily_rate: 0, monthly_rate: 0, status: 'available' as 'available' | 'rented' | 'maintenance', notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')
  const [contracts, setContracts] = useState<any[]>([])
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  useEffect(() => {
    fetchEquipment()
    window.api.getContracts().then((c) => setContracts(c)).catch(() => {})
    window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {})
  }, [])

  const equipmentWithContracts = equipment.map((eq) => {
    const activeContracts = contracts.filter((c: any) => c.equipment_id === eq.id && c.status === 'active')
    return { ...eq, hasActiveContracts: activeContracts.length > 0, activeContractCount: activeContracts.length }
  })

  const filtered = equipmentWithContracts.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', type: 'حفار', current_meter: 0, hourly_rate: 0, daily_rate: 0, monthly_rate: 0, status: 'available', notes: '' })
    setShowModal(true)
  }

  const openEdit = (eq: Equipment) => {
    setEditing(eq)
    setForm({
      name: eq.name, type: eq.type, current_meter: eq.current_meter,
      hourly_rate: eq.hourly_rate, daily_rate: eq.daily_rate, monthly_rate: eq.monthly_rate,
      status: eq.status, notes: eq.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await updateEquipment(editing.id, form)
    } else {
      await addEquipment(form as any)
    }
    setShowModal(false)
  }

  const handleDeleteClick = (id: number) => {
    const eq = equipmentWithContracts.find((e: any) => e.id === id)
    if (eq && eq.hasActiveContracts) {
      setDeleteTargetId(id)
      setShowConfirmDelete(true)
    } else if (window.confirm('هل أنت متأكد من حذف هذه المعدة؟')) {
      deleteEquipment(id)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteEquipment(deleteTargetId)
      setShowConfirmDelete(false)
      setDeleteTargetId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المعدات</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة أسطول المعدات الثقيلة</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة معدة
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="بحث في المعدات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pr-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">الكود</th>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">العداد</th>
                <th className="px-4 py-3 text-right">بالساعة</th>
                <th className="px-4 py-3 text-right">بيومي</th>
                <th className="px-4 py-3 text-right">شهري</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => (
                <tr key={eq.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-sm">{eq.code}</td>
                  <td className="px-4 py-3 font-medium">{eq.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{eq.type}</td>
                  <td className="px-4 py-3 font-mono">{eq.current_meter.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">{currency} {eq.hourly_rate}</td>
                  <td className="px-4 py-3">{currency} {eq.daily_rate}</td>
                  <td className="px-4 py-3">{currency} {eq.monthly_rate}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[eq.status]}`}>{statusLabels[eq.status]}</span>
                    {eq.hasActiveContracts && (
                      <span className="badge badge-yellow mr-1 mt-1 inline-block">{eq.activeContractCount} عقد نشط</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDeleteClick(eq.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <PackageOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد معدات</p>
                    <p className="text-slate-300 text-sm mt-1">اضغط "إضافة معدة" لبدء الإضافة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg mx-4 card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editing ? 'تعديل معدة' : 'إضافة معدة جديدة'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="CAT 320" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-field">
                    {equipmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">قراءة العداد</label>
                  <input type="number" value={form.current_meter} onChange={(e) => setForm({ ...form, current_meter: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر بالساعة ($)</label>
                  <input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر اليومي ($)</label>
                  <input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر الشهري ($)</label>
                  <input type="number" value={form.monthly_rate} onChange={(e) => setForm({ ...form, monthly_rate: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="select-field">
                    <option value="available">متاحة</option>
                    <option value="rented">مؤجرة</option>
                    <option value="maintenance">صيانة</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={!form.name || form.hourly_rate < 0 || form.daily_rate < 0 || form.monthly_rate < 0}>
                  {editing ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
              {(form.hourly_rate < 0 || form.daily_rate < 0 || form.monthly_rate < 0) &&
                <p className="text-red-500 text-xs mt-2">⚠️ لا يمكن أن تكون الأسعار سالبة</p>
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog for equipment with active contracts */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md mx-4 card p-6 border-red-200 dark:border-red-900/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400">تحذير!</h3>
                  <p className="text-sm text-slate-500">هذه المعدة لديها عقود نشطة</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  ⚠️ لا يمكن حذف هذه المعدة لأنها مرتبطة بـ <strong>عقد نشط واحد على الأقل</strong>.
                  يرجى أولاً إغلاق أو إلغاء جميع العقود المرتبطة قبل الحذف.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirmDelete(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleConfirmDelete} className="btn-danger">فهمت</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
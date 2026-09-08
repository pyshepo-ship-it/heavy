import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import type { Employee } from '@shared/types'

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', role: '', salary: 0, status: 'active' as 'active' | 'inactive', notes: ''
  })
  const [currency, setCurrency] = useState('ر.س')

  const fetchEmployees = async () => {
    const data = await window.api.getEmployees()
    setEmployees(data)
  }

  useEffect(() => { fetchEmployees(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', phone: '', role: '', salary: 0, status: 'active', notes: '' })
    setShowModal(true)
  }

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({
      name: emp.name, phone: emp.phone, role: emp.role,
      salary: emp.salary, status: emp.status, notes: emp.notes
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await window.api.updateEmployee(editing.id, form)
    } else {
      await window.api.createEmployee(form)
    }
    setShowModal(false)
    fetchEmployees()
  }

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await window.api.deleteEmployee(id)
      fetchEmployees()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الموظفين والرواتب والسلفيات</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة الموظفين والرواتب</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة موظف
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في الموظفين..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الهاتف</th>
                <th className="px-4 py-3 text-right">الوظيفة</th>
                <th className="px-4 py-3 text-right">الراتب</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="table-row">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.phone}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.role}</td>
                  <td className="px-4 py-3 font-medium">{currency} {emp.salary.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${emp.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">لا يوجد موظفين</td></tr>
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
                <h2 className="text-lg font-bold">{editing ? 'تعديل الموظف' : 'إضافة موظف جديد'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="اسم الموظف" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الهاتف</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="05XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوظيفة</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field" placeholder="مشرف، فني..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الراتب ($)</label>
                  <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="select-field">
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
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

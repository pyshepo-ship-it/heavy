import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Eye, Trash2, X, CheckCircle, CreditCard, ArrowRight } from 'lucide-react'

interface PayrollRun {
  id: number
  month: string
  notes: string
  status: 'draft' | 'processed' | 'paid'
  employee_count: number
  total_base: number
  total_advances: number
  total_deductions: number
  total_overtime_pay: number
  total_bonuses: number
  total_net: number
  processed_at: string | null
  paid_at: string | null
}

interface PayrollItem {
  id: number
  employee_id: number
  employee_name: string
  base_salary: number
  overtime_hours: number
  overtime_pay: number
  bonus: number
  advances: number
  deductions: number
  net_pay: number
  status: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'badge-yellow' },
  processed: { label: 'معالجة', color: 'badge-blue' },
  paid: { label: 'مدفوعة', color: 'badge-green' },
}

const itemStatusMap: Record<string, string> = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
}

export default function Payroll() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [items, setItems] = useState<PayrollItem[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [form, setForm] = useState({ month: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('ر.س')

  const fetchRuns = async () => {
    const data = await window.api.getPayrollRuns()
    setRuns(data)
  }

  useEffect(() => { fetchRuns(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!form.month) return
    setLoading(true)
    try {
      await window.api.createPayrollRun(form.month, form.notes)
      setShowCreateModal(false)
      setForm({ month: '', notes: '' })
      fetchRuns()
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (runId: number) => {
    if (!confirm('هل أنت متأكد من معالجة هذه المسيرة؟')) return
    setLoading(true)
    try {
      await window.api.processPayrollRun(runId)
      fetchRuns()
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (runId: number) => {
    if (!confirm('هل أنت متأكد من تحديد هذه المسيرة كمدفوعة؟')) return
    setLoading(true)
    try {
      await window.api.markPayrollRunPaid(runId)
      fetchRuns()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (runId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المسيرة؟')) return
    setLoading(true)
    try {
      await window.api.deletePayrollRun(runId)
      fetchRuns()
    } finally {
      setLoading(false)
    }
  }

  const openDetails = async (run: PayrollRun) => {
    setLoading(true)
    try {
      const runDetails = await window.api.getPayrollRunById(run.id)
      setSelectedRun(runDetails)
      const runItems = await window.api.getPayrollRunItems(run.id)
      setItems(runItems)
      setShowDetailsModal(true)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => n.toLocaleString('ar-EG')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">مسيرات الرواتب</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة مسيرات الرواتب الشهرية</p>
        </div>
        <button onClick={() => { setForm({ month: '', notes: '' }); setShowCreateModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إنشاء مسيرة جديدة
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">رقم المسيرة</th>
                <th className="px-4 py-3 text-right">الشهر</th>
                <th className="px-4 py-3 text-right">عدد الموظفين</th>
                <th className="px-4 py-3 text-right">إجمالي الإجمالي</th>
                <th className="px-4 py-3 text-right">إجمالي الخصومات</th>
                <th className="px-4 py-3 text-right">صافي الإجمالي</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">تاريخ المعالجة</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const st = statusMap[run.status] || statusMap.draft
                return (
                  <tr key={run.id} className="table-row">
                    <td className="px-4 py-3 font-medium">#{run.id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{run.month}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{run.employee_count}</td>
                    <td className="px-4 py-3 font-medium">{currency} {fmt(run.total_base)}</td>
                    <td className="px-4 py-3 text-red-500">{currency} {fmt(run.total_advances + run.total_deductions)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{currency} {fmt(run.total_net)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {run.processed_at ? new Date(run.processed_at).toLocaleDateString('ar-EG') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetails(run)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="عرض التفاصيل">
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        {run.status === 'draft' && (
                          <button onClick={() => handleDelete(run.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="حذف">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                        {run.status === 'processed' && (
                          <button onClick={() => handleMarkPaid(run.id)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="تحديد كمدفوعة">
                            <CreditCard className="w-4 h-4 text-green-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {runs.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">لا توجد مسيرات رواتب</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">إنشاء مسيرة رواتب جديدة</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الشهر (YYYY-MM)</label>
                  <input
                    type="month"
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="input-field"
                    placeholder="2026-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreate} className="btn-primary" disabled={!form.month || loading}>
                  {loading ? 'جاري المعالجة...' : 'إنشاء المسيرة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailsModal && selectedRun && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-5xl mx-4 card p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">تفاصيل المسيرة #{selectedRun.id}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">الشهر: {selectedRun.month}</p>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelectedRun(null); setItems([]) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">عدد الموظفين</p>
                  <p className="text-lg font-bold">{selectedRun.employee_count}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">إجمالي الرواتب</p>
                  <p className="text-lg font-bold">{currency} {fmt(selectedRun.total_base)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">إجمالي الخصومات والسلفيات</p>
                  <p className="text-lg font-bold text-red-500">{currency} {fmt(selectedRun.total_advances + selectedRun.total_deductions)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-xs text-slate-500">صافي الدفع</p>
                  <p className="text-lg font-bold text-green-600">{currency} {fmt(selectedRun.total_net)}</p>
                </div>
              </div>

              {selectedRun.status === 'draft' && (
                <div className="mb-4">
                  <button onClick={() => { handleProcess(selectedRun.id); setShowDetailsModal(false) }} className="btn-primary flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" /> معالجة المسيرة
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-right">الموظف</th>
                      <th className="px-4 py-3 text-right">الراتب الأساسي</th>
                      <th className="px-4 py-3 text-right">ساعات إضافية</th>
                      <th className="px-4 py-3 text-right">مبلغ إضافي</th>
                      <th className="px-4 py-3 text-right">مكافأة</th>
                      <th className="px-4 py-3 text-right">السلفيات</th>
                      <th className="px-4 py-3 text-right">الخصومات</th>
                      <th className="px-4 py-3 text-right">صافي الدفع</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="px-4 py-3 font-medium">{item.employee_name}</td>
                        <td className="px-4 py-3">{currency} {fmt(item.base_salary)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.overtime_hours}h</td>
                        <td className="px-4 py-3">{currency} {fmt(item.overtime_pay)}</td>
                        <td className="px-4 py-3 text-green-600">{currency} {fmt(item.bonus)}</td>
                        <td className="px-4 py-3 text-red-500">{currency} {fmt(item.advances)}</td>
                        <td className="px-4 py-3 text-red-500">{currency} {fmt(item.deductions)}</td>
                        <td className="px-4 py-3 font-bold">{currency} {fmt(item.net_pay)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${item.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                            {itemStatusMap[item.status] || item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">لا توجد عناصر في هذه المسيرة</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

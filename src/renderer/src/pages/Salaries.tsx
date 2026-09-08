import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, X } from 'lucide-react'

interface SalaryPayment {
  id: number
  employeeId: number
  employeeName: string
  month: string
  baseSalary: number
  overtimeHours: number
  overtimeAmount: number
  bonus: number
  totalAdvances: number
  totalDeductions: number
  netSalary: number
  status: string
  paidAt: string | null
}

interface Advance {
  id: number
  employeeId: number
  employeeName: string
  amount: number
  description: string
  date: string
  deducted: number
}

interface Deduction {
  id: number
  employeeId: number
  employeeName: string
  type: string
  amount: number
  description: string
  date: string
  applied: number
}

interface Employee {
  id: number
  name: string
}

type Tab = 'payments' | 'advances' | 'deductions'

export default function Salaries() {
  const [activeTab, setActiveTab] = useState<Tab>('payments')
  const [employees, setEmployees] = useState<Employee[]>([])

  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [deductions, setDeductions] = useState<Deduction[]>([])

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showDeductionModal, setShowDeductionModal] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    employeeId: 0, month: '', baseSalary: 0, overtimeHours: 0, overtimeRate: 0, overtimeAmount: 0, bonus: 0, totalAdvances: 0, totalDeductions: 0
  })
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: 0, amount: 0, description: '', date: ''
  })
  const [deductionForm, setDeductionForm] = useState({
    employeeId: 0, type: 'غياب', amount: 0, description: '', date: ''
  })

  const [searchPayments, setSearchPayments] = useState('')
  const [searchAdvances, setSearchAdvances] = useState('')
  const [searchDeductions, setSearchDeductions] = useState('')
  const [currency, setCurrency] = useState('ر.س')

  const fetchEmployees = async () => {
    const data = await window.api.getEmployees()
    setEmployees(data)
  }

  const fetchPayments = async () => {
    const data = await window.api.getSalaryPayments()
    setPayments(data)
  }

  const fetchAdvances = async () => {
    const data = await window.api.getUndeductedAdvances()
    setAdvances(data)
  }

  const fetchDeductions = async () => {
    const data = await window.api.getUnappliedDeductions()
    setDeductions(data)
  }

  useEffect(() => {
    fetchEmployees()
    fetchPayments()
    fetchAdvances()
    fetchDeductions()
    window.api.getSettings().then((s) => {
      if (s && s.currency) setCurrency(s.currency)
    }).catch(() => {})
  }, [])

  const filteredPayments = payments.filter(
    (p) => (p.employeeName || '').includes(searchPayments) || (p.month || '').includes(searchPayments)
  )

  const filteredAdvances = advances.filter(
    (a) => (a.employeeName || '').includes(searchAdvances)
  )

  const filteredDeductions = deductions.filter(
    (d) => (d.employeeName || '').includes(searchDeductions)
  )

  const handleCreatePayment = async () => {
    const net = paymentForm.baseSalary + paymentForm.overtimeAmount + paymentForm.bonus - paymentForm.totalAdvances - paymentForm.totalDeductions
    await window.api.createSalaryPayment({ ...paymentForm, netSalary: net })
    setShowPaymentModal(false)
    fetchPayments()
  }

  const handleMarkPaid = async (id: number) => {
    if (confirm('هل أنت متأكد من تسجيل الدفع؟')) {
      await window.api.markSalaryPaymentPaid(id)
      fetchPayments()
    }
  }

  const handleDeletePayment = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القيد؟')) {
      await window.api.deleteSalaryPayment(id)
      fetchPayments()
    }
  }

  const handleCreateAdvance = async () => {
    await window.api.createSalaryAdvance(advanceForm)
    setShowAdvanceModal(false)
    fetchAdvances()
  }

  const handleDeleteAdvance = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه السلفية؟')) {
      await window.api.deleteSalaryAdvance(id)
      fetchAdvances()
    }
  }

  const handleCreateDeduction = async () => {
    await window.api.createSalaryDeduction(deductionForm)
    setShowDeductionModal(false)
    fetchDeductions()
  }

  const handleDeleteDeduction = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الخصم؟')) {
      await window.api.deleteSalaryDeduction(id)
      fetchDeductions()
    }
  }

  const tabs = [
    { key: 'payments' as Tab, label: 'مدفوعات الرواتب' },
    { key: 'advances' as Tab, label: 'السلفيات' },
    { key: 'deductions' as Tab, label: 'الخصومات' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الرواتب والسلفيات والخصومات</h1>
        <p className="text-slate-500 dark:text-slate-400">إدارة مدفوعات الرواتب والسلفيات والخصومات</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في المدفوعات..."
                value={searchPayments}
                onChange={(e) => setSearchPayments(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <button
              onClick={() => {
                setPaymentForm({ employeeId: 0, month: '', baseSalary: 0, overtimeHours: 0, overtimeRate: 0, overtimeAmount: 0, bonus: 0, totalAdvances: 0, totalDeductions: 0 })
                setShowPaymentModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> إضافة قيد راتب
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">رقم القيد</th>
                    <th className="px-4 py-3 text-right">الموظف</th>
                    <th className="px-4 py-3 text-right">الشهر</th>
                    <th className="px-4 py-3 text-right">الراتب الأساسي</th>
                    <th className="px-4 py-3 text-right">ساعات إضافية</th>
                    <th className="px-4 py-3 text-right">مبلغ إضافي</th>
                    <th className="px-4 py-3 text-right">مكافأة</th>
                    <th className="px-4 py-3 text-right">إجمالي السلفيات</th>
                    <th className="px-4 py-3 text-right">إجمالي الخصومات</th>
                    <th className="px-4 py-3 text-right">صافي الراتب</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="px-4 py-3 text-right">تاريخ الدفع</th>
                    <th className="px-4 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="px-4 py-3 font-medium">{p.id}</td>
                      <td className="px-4 py-3">{p.employeeName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.month}</td>
                      <td className="px-4 py-3 font-medium">{currency} {p.baseSalary.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.overtimeHours}</td>
                      <td className="px-4 py-3 font-medium">{currency} {p.overtimeAmount.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 font-medium">{currency} {p.bonus.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 font-medium">{currency} {p.totalAdvances.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 font-medium">{currency} {p.totalDeductions.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 font-medium text-primary dark:text-primary-400">{currency} {p.netSalary.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                          {p.status === 'paid' ? 'مدفوع' : 'معلق'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.paidAt || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.status !== 'paid' && (
                            <button onClick={() => handleMarkPaid(p.id)} className="btn-primary text-xs px-3 py-1">
                              تسجيل الدفع
                            </button>
                          )}
                          <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={13} className="px-4 py-12 text-center text-slate-400">لا توجد مدفوعات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في السلفيات..."
                value={searchAdvances}
                onChange={(e) => setSearchAdvances(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <button
              onClick={() => {
                setAdvanceForm({ employeeId: 0, amount: 0, description: '', date: '' })
                setShowAdvanceModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> إضافة سلفية
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">الموظف</th>
                    <th className="px-4 py-3 text-right">المبلغ</th>
                    <th className="px-4 py-3 text-right">الوصف</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvances.map((a) => (
                    <tr key={a.id} className="table-row">
                      <td className="px-4 py-3 font-medium">{a.employeeName}</td>
                      <td className="px-4 py-3 font-medium">{currency} {a.amount.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.description}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.date}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteAdvance(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdvances.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">لا توجد سلفيات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في الخصومات..."
                value={searchDeductions}
                onChange={(e) => setSearchDeductions(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <button
              onClick={() => {
                setDeductionForm({ employeeId: 0, type: 'غياب', amount: 0, description: '', date: '' })
                setShowDeductionModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> إضافة خصم
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">الموظف</th>
                    <th className="px-4 py-3 text-right">النوع</th>
                    <th className="px-4 py-3 text-right">المبلغ</th>
                    <th className="px-4 py-3 text-right">الوصف</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeductions.map((d) => (
                    <tr key={d.id} className="table-row">
                      <td className="px-4 py-3 font-medium">{d.employeeName}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-yellow">{d.type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{currency} {d.amount.toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.description}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.date}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteDeduction(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDeductions.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">لا توجد خصومات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">إضافة قيد راتب</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الموظف</label>
                  <select value={paymentForm.employeeId} onChange={(e) => setPaymentForm({ ...paymentForm, employeeId: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر موظف</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الشهر</label>
                  <input type="month" value={paymentForm.month} onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الراتب الأساسي ($)</label>
                  <input type="number" value={paymentForm.baseSalary} onChange={(e) => setPaymentForm({ ...paymentForm, baseSalary: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ساعات إضافية</label>
                  <input type="number" value={paymentForm.overtimeHours} onChange={(e) => setPaymentForm({ ...paymentForm, overtimeHours: Number(e.target.value) })} className="input-field" />
                </div>
<div>
                   <label className="block text-sm font-medium mb-1">معدل الإضافي (ر/ساعة)</label>
                   <input type="number" value={paymentForm.overtimeRate} onChange={(e) => setPaymentForm({ ...paymentForm, overtimeRate: Number(e.target.value) })} className="input-field" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">مبلغ إضافي ($)</label>
                   <input type="number" value={paymentForm.overtimeAmount} onChange={(e) => setPaymentForm({ ...paymentForm, overtimeAmount: Number(e.target.value) })} className="input-field" />
                 </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مكافأة ($)</label>
                  <input type="number" value={paymentForm.bonus} onChange={(e) => setPaymentForm({ ...paymentForm, bonus: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">إجمالي السلفيات ($)</label>
                  <input type="number" value={paymentForm.totalAdvances} onChange={(e) => setPaymentForm({ ...paymentForm, totalAdvances: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">إجمالي الخصومات ($)</label>
                  <input type="number" value={paymentForm.totalDeductions} onChange={(e) => setPaymentForm({ ...paymentForm, totalDeductions: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowPaymentModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreatePayment} className="btn-primary" disabled={!paymentForm.employeeId || !paymentForm.month}>إنشاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdvanceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">إضافة سلفية</h2>
                <button onClick={() => setShowAdvanceModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الموظف</label>
                  <select value={advanceForm.employeeId} onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر موظف</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ($)</label>
                  <input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={advanceForm.date} onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={advanceForm.description} onChange={(e) => setAdvanceForm({ ...advanceForm, description: e.target.value })} className="input-field" placeholder="سبب السلفية" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdvanceModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreateAdvance} className="btn-primary" disabled={!advanceForm.employeeId || !advanceForm.amount}>إنشاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeductionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">إضافة خصم</h2>
                <button onClick={() => setShowDeductionModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الموظف</label>
                  <select value={deductionForm.employeeId} onChange={(e) => setDeductionForm({ ...deductionForm, employeeId: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر موظف</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select value={deductionForm.type} onChange={(e) => setDeductionForm({ ...deductionForm, type: e.target.value })} className="select-field">
                    <option value="غياب">غياب</option>
                    <option value="تأخر">تأخر</option>
                    <option value="خصم">خصم</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ($)</label>
                  <input type="number" value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={deductionForm.date} onChange={(e) => setDeductionForm({ ...deductionForm, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={deductionForm.description} onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })} className="input-field" placeholder="سبب الخصم" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDeductionModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreateDeduction} className="btn-primary" disabled={!deductionForm.employeeId || !deductionForm.amount}>إنشاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Wallet, ArrowDownCircle, ShoppingCart, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import type { Custody, CustodyTransaction, Employee, Driver, Bank } from '@shared/types'

export default function Custody() {
  const [custodies, setCustodies] = useState<Custody[]>([])
  const [transactions, setTransactions] = useState<Record<number, CustodyTransaction[]>>({})
  const [employees, setEmployees] = useState<Employee[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const [showNewModal, setShowNewModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null)
  const [newForm, setNewForm] = useState({
    person_type: 'employee' as 'employee' | 'driver', person_id: 0, bank_id: 0, amount: 0, notes: ''
  })
  const [depositForm, setDepositForm] = useState({ bank_id: 0, amount: 0, description: '' })
  const [purchaseForm, setPurchaseForm] = useState({ vendor_name: '', description: '', amount: 0 })
  const [closeForm, setCloseForm] = useState({ notes: '' })
  const [currency, setCurrency] = useState('ر.س')

  const fetchAll = async () => {
    const [c, emp, drv, b] = await Promise.all([
      window.api.getCustody(),
      window.api.getEmployees(),
      window.api.getDrivers(),
      window.api.getBanks()
    ])
    setCustodies(c)
    setEmployees(emp)
    setDrivers(drv)
    setBanks(b)
  }

  useEffect(() => { fetchAll(); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {}) }, [])

  const filtered = custodies.filter(
    (c) =>
      c.custody_number.toLowerCase().includes(search.toLowerCase())
  )

  const totalOpen = custodies.filter((c) => c.status === 'open').length
  const totalAmount = custodies.filter((c) => c.status === 'open').reduce((sum, c) => sum + c.amount, 0)
  const activeCount = custodies.filter((c) => c.status === 'open').length

  const getPersonName = (id: number, type: string) => {
    if (type === 'employee') return employees.find((e) => e.id === id)?.name || '-'
    return drivers.find((d) => d.id === id)?.name || '-'
  }

  const getBankName = (id: number) => banks.find((b) => b.id === id)?.name || '-'

  const availablePeople = newForm.person_type === 'employee' ? employees : drivers

  const handleCreate = async () => {
    await window.api.openCustody(newForm)
    setShowNewModal(false)
    setNewForm({ person_type: 'employee', person_id: 0, bank_id: 0, amount: 0, notes: '' })
    fetchAll()
  }

  const handleDeposit = async () => {
    if (!selectedCustody) return
    await window.api.depositCustody(selectedCustody.id, depositForm.bank_id, depositForm.amount, depositForm.description)
    setShowDepositModal(false)
    setDepositForm({ bank_id: 0, amount: 0, description: '' })
    fetchAll()
  }

  const handlePurchase = async () => {
    if (!selectedCustody) return
    await window.api.purchaseCustody(selectedCustody.id, purchaseForm.vendor_name, purchaseForm.description, purchaseForm.amount)
    setShowPurchaseModal(false)
    setPurchaseForm({ vendor_name: '', description: '', amount: 0 })
    fetchAll()
  }

  const handleClose = async () => {
    if (!selectedCustody) return
    await window.api.closeCustody(selectedCustody.id, closeForm.notes)
    setShowCloseModal(false)
    setCloseForm({ notes: '' })
    fetchAll()
  }

  const toggleRow = async (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null)
      return
    }
    setExpandedRow(id)
    if (!transactions[id]) {
      const txns = await window.api.getCustodyTransactions(id)
      setTransactions((prev) => ({ ...prev, [id]: txns }))
    }
  }

  const openDeposit = (c: Custody) => {
    setSelectedCustody(c)
    setDepositForm({ bank_id: c.bank_id, amount: 0, description: '' })
    setShowDepositModal(true)
  }

  const openPurchase = (c: Custody) => {
    setSelectedCustody(c)
    setPurchaseForm({ vendor_name: '', description: '', amount: 0 })
    setShowPurchaseModal(true)
  }

  const openClose = (c: Custody) => {
    setSelectedCustody(c)
    setCloseForm({ notes: '' })
    setShowCloseModal(true)
  }

  const closingSummary = selectedCustody ? {
    surplus: selectedCustody.remaining > 0 ? selectedCustody.remaining : 0,
    deficit: selectedCustody.remaining < 0 ? Math.abs(selectedCustody.remaining) : 0
  } : { surplus: 0, deficit: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">العهد</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة عهد الموظفين والسائقين</p>
        </div>
        <button onClick={() => { setNewForm({ person_type: 'employee', person_id: 0, bank_id: 0, amount: 0, notes: '' }); setShowNewModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> فتح عهدة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي العهد المفتوحة</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalOpen}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <ArrowDownCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي المبالغ في العهد</p>
              <p className="text-xl font-bold text-green-500">{currency} {totalAmount.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">عدد العهد النشطة</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث في العهد..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right w-8"></th>
                <th className="px-4 py-3 text-right">رقم العهدة</th>
                <th className="px-4 py-3 text-right">الشخص</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">المبلغ الأصلي</th>
                <th className="px-4 py-3 text-right">المصروف</th>
                <th className="px-4 py-3 text-right">المتبقي</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="table-row cursor-pointer" onClick={() => toggleRow(c.id)}>
                    <td className="px-2 py-3">
                      {expandedRow === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{c.custody_number}</td>
                    <td className="px-4 py-3 font-medium">{getPersonName(c.person_id, c.person_type)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.person_type === 'employee' ? 'badge-blue' : 'badge-green'}`}>
                        {c.person_type === 'employee' ? 'موظف' : 'سائق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{currency} {c.amount.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-3 text-red-500">{currency} {c.spent.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${c.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {currency} {c.remaining.toLocaleString('ar-EG')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.status === 'open' ? 'badge-green' : 'badge-blue'}`}>
                        {c.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {c.status === 'open' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDeposit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="تعزيز">
                            <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                          </button>
                          <button onClick={() => openPurchase(c)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20" title="مشتريات">
                            <ShoppingCart className="w-4 h-4 text-purple-500" />
                          </button>
                          <button onClick={() => openClose(c)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="إغلاق">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedRow === c.id && (
                    <tr>
                      <td colSpan={9} className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-sm">
                          <h4 className="font-bold mb-2">سجل المعاملات</h4>
                          {transactions[c.id] && transactions[c.id].length > 0 ? (
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-slate-500">
                                  <th className="text-right pb-1">التاريخ</th>
                                  <th className="text-right pb-1">النوع</th>
                                  <th className="text-right pb-1">المبلغ</th>
                                  <th className="text-right pb-1">الوصف</th>
                                </tr>
                              </thead>
                              <tbody>
                                {transactions[c.id].map((txn) => (
                                  <tr key={txn.id} className="border-t border-slate-200 dark:border-slate-700">
                                    <td className="py-1">{txn.date}</td>
                                    <td className="py-1">
                                      <span className={`badge ${txn.type === 'deposit' ? 'badge-green' : txn.type === 'purchase' ? 'badge-red' : txn.type === 'reimbursement' ? 'badge-yellow' : 'badge-blue'}`}>
                                        {txn.type === 'deposit' ? 'إيداع' : txn.type === 'purchase' ? 'مشترى' : txn.type === 'reimbursement' ? 'سداد' : 'إغلاق'}
                                      </span>
                                    </td>
                                    <td className="py-1 font-medium">{currency} {txn.amount.toLocaleString('ar-EG')}</td>
                                    <td className="py-1 text-slate-500">{txn.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-slate-400">لا توجد معاملات</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">لا توجد عهد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showNewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">فتح عهدة جديدة</h2>
                <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع الشخص</label>
                  <select value={newForm.person_type} onChange={(e) => setNewForm({ ...newForm, person_type: e.target.value as 'employee' | 'driver', person_id: 0 })} className="select-field">
                    <option value="employee">موظف</option>
                    <option value="driver">سائق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{newForm.person_type === 'employee' ? 'الموظف' : 'السائق'}</label>
                  <select value={newForm.person_id} onChange={(e) => setNewForm({ ...newForm, person_id: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر...</option>
                    {availablePeople.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">البنك / الخزينة</label>
                  <select value={newForm.bank_id} onChange={(e) => setNewForm({ ...newForm, bank_id: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر...</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ($)</label>
                  <input type="number" value={newForm.amount} onChange={(e) => setNewForm({ ...newForm, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNewModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleCreate} className="btn-primary" disabled={!newForm.person_id || !newForm.bank_id || !newForm.amount}>إنشاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDepositModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">تعزيز العهدة - {selectedCustody?.custody_number}</h2>
                <button onClick={() => setShowDepositModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">البنك / الخزينة</label>
                  <select value={depositForm.bank_id} onChange={(e) => setDepositForm({ ...depositForm, bank_id: Number(e.target.value) })} className="select-field">
                    <option value={0}>اختر...</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ($)</label>
                  <input type="number" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={depositForm.description} onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })} className="input-field" placeholder="سبب التعزيز" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDepositModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleDeposit} className="btn-primary" disabled={!depositForm.bank_id || !depositForm.amount}>إيداع</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">مشتريات على العهدة - {selectedCustody?.custody_number}</h2>
                <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم المورد</label>
                  <input value={purchaseForm.vendor_name} onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor_name: e.target.value })} className="input-field" placeholder="اسم المورد" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <input value={purchaseForm.description} onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })} className="input-field" placeholder="وصف المشتريات" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ ($)</label>
                  <input type="number" value={purchaseForm.amount} onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: Number(e.target.value) })} className="input-field" />
                </div>
                {selectedCustody && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                    <span className="text-slate-500">المتبقي في العهدة: </span>
                    <span className="font-bold">{currency} {selectedCustody.remaining.toLocaleString('ar-EG')}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowPurchaseModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handlePurchase} className="btn-primary" disabled={!purchaseForm.vendor_name || !purchaseForm.amount || Boolean(selectedCustody && purchaseForm.amount > selectedCustody.remaining)}>تسجيل المشتريات</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCloseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg mx-4 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">إغلاق العهدة - {selectedCustody?.custody_number}</h2>
                <button onClick={() => setShowCloseModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                {selectedCustody && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">المبلغ الأصلي:</span>
                      <span className="font-medium">{currency} {selectedCustody.amount.toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">إجمالي المصروفات:</span>
                      <span className="font-medium text-red-500">{currency} {selectedCustody.spent.toLocaleString('ar-EG')}</span>
                    </div>
                    <hr className="border-slate-200 dark:border-slate-700" />
                    <div className="flex justify-between">
                      <span className="text-slate-500">المتبقي:</span>
                      <span className={`font-bold ${selectedCustody.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {currency} {selectedCustody.remaining.toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>
                )}
                {closingSummary.surplus > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
                    زائد: {currency} {closingSummary.surplus.toLocaleString('ar-EG')} - سيتم خصمه من الراتب
                  </div>
                )}
                {closingSummary.deficit > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                    ناقص: {currency} {closingSummary.deficit.toLocaleString('ar-EG')} - سيتم صرفه مع الراتب
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">ملاحظات الإغلاق</label>
                  <textarea value={closeForm.notes} onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })} className="input-field" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCloseModal(false)} className="btn-secondary">إلغاء</button>
                <button onClick={handleClose} className="btn-primary">إغلاق العهدة</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Printer, FileText, PackageOpen, Inbox, Receipt, TrendingUp } from 'lucide-react'
import type { Equipment } from '@shared/types'

const tabs = [
  { key: 'pnl', label: 'أرباح وخسائر الشركة' },
  { key: 'equipment', label: 'تقرير المعدات' },
  { key: 'contracts', label: 'تقرير العقود' },
  { key: 'expenses', label: 'تقرير المصروفات' }
]

interface PnLData {
  total_invoices: number
  total_general_expenses: number
  total_purchases: number
  total_salaries: number
  total_expenses: number
  net_profit: number
}

interface EquipmentReport {
  equipment_id: number
  equipment_name: string
  equipment_code: string
  contracts_count: number
  total_contracts: number
  total_invoices: number
  voucher_expenses: number
  voucher_revenue: number
  total_expenses: number
  net_profit: number
}

interface ContractReport {
  contract_number: string
  client_name: string
  equipment_name: string
  contract_type: string
  total_amount: number
  status: string
}

interface ExpenseReport {
  date: string
  equipment_name: string
  category: string
  description: string
  amount: number
}

const contractStatusColors: Record<string, string> = {
  active: 'badge-green',
  closed: 'badge-blue',
  cancelled: 'badge-red'
}
const contractStatusLabels: Record<string, string> = {
  active: 'نشط',
  closed: 'مغلق',
  cancelled: 'ملغي'
}
const contractTypeLabels: Record<string, string> = {
  daily: 'يومي',
  monthly: 'شهري'
}

export default function Reports() {
const [activeTab, setActiveTab] = useState('pnl')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [equipmentFilter, setEquipmentFilter] = useState<number>(0)
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])

  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [equipmentData, setEquipmentData] = useState<EquipmentReport[]>([])
  const [contractsData, setContractsData] = useState<ContractReport[]>([])
  const [expensesData, setExpensesData] = useState<ExpenseReport[]>([])
  const [formatCurrency, setFormatCurrency] = useState('ر.س')

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTab = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'pnl') {
        const data = await window.api.getReportsPnL(dateFrom, dateTo)
        setPnlData(data)
      } else if (activeTab === 'equipment') {
        const data = await window.api.getReportsEquipment(equipmentFilter || null, dateFrom, dateTo)
        setEquipmentData(data)
      } else if (activeTab === 'contracts') {
        const data = await window.api.getReportsContracts(dateFrom, dateTo)
        setContractsData(data)
      } else if (activeTab === 'expenses') {
        const data = await window.api.getReportsExpenses(dateFrom, dateTo)
        setExpensesData(data)
      }
    } catch (e) {
      setError('حدث خطأ أثناء تحميل البيانات')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.api.getEquipment().then((list) => setEquipmentList(list)).catch(() => {})
    window.api.getSettings().then((s) => {
      if (s && s.currency) setFormatCurrency(s.currency)
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchTab() }, [activeTab, dateFrom, dateTo, equipmentFilter])

  const handlePrint = () => { window.print() }

  const dateRangePicker = (
    <div className="flex items-center gap-3">
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">من</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">إلى</label>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
      </div>
    </div>
  )

  const equipmentFilterDropdown = (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">المعدة</label>
      <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(Number(e.target.value))} className="select-field">
        <option value={0}>جميع المعدات</option>
        {equipmentList.map((eq) => (
          <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
        ))}
      </select>
    </div>
  )

  const formatMoney = (val: number | null | undefined) => formatCurrency + (Number(val) || 0).toLocaleString('ar-EG')

  const pnlContent = (
    <div className="space-y-6">
      {loading && <div className="text-center py-8 text-slate-400">جاري تحميل البيانات...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && !pnlData && <div className="text-center py-16">
        <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 font-medium text-lg">لا توجد بيانات لفترة التقرير المحددة</p>
        <p className="text-slate-300 text-sm mt-1">غيّر فترة التاريخ أو اختر تبويب آخر</p>
      </div>}
      {pnlData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">الإيرادات</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMoney(pnlData.total_invoices)}</div>
              <div className="text-xs text-slate-400 mt-1">إجمالي الفواتير المحصلة</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">المصروفات</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatMoney(pnlData.total_expenses)}</div>
              <div className="text-xs text-slate-400 mt-1">المصروفات العامة + المشتريات + الرواتب</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">صافي الربح / الخسارة</div>
              <div className={`text-2xl font-bold ${pnlData.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {pnlData.net_profit >= 0 ? '+' : ''}{formatMoney(pnlData.net_profit)}
              </div>
              <div className="text-xs text-slate-400 mt-1">الإيرادات - المصروفات</div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">البند</th>
                    <th className="px-4 py-3 text-right">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row">
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">الإيرادات — إجمالي الفواتير المحصلة</td>
                    <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">{formatMoney(pnlData.total_invoices)}</td>
                  </tr>
                  <tr className="table-row bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400" colSpan={2}>المصروفات</td>
                  </tr>
                  <tr className="table-row">
                    <td className="px-4 py-3 pr-8 text-slate-600 dark:text-slate-400">المصروفات العامة</td>
                    <td className="px-4 py-3">{formatMoney(pnlData.total_general_expenses)}</td>
                  </tr>
                  <tr className="table-row">
                    <td className="px-4 py-3 pr-8 text-slate-600 dark:text-slate-400">المشتريات</td>
                    <td className="px-4 py-3">{formatMoney(pnlData.total_purchases)}</td>
                  </tr>
                  <tr className="table-row">
                    <td className="px-4 py-3 pr-8 text-slate-600 dark:text-slate-400">الرواتب</td>
                    <td className="px-4 py-3">{formatMoney(pnlData.total_salaries)}</td>
                  </tr>
                  <tr className="table-row bg-slate-100 dark:bg-slate-700/50">
                    <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">إجمالي المصروفات</td>
                    <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{formatMoney(pnlData.total_expenses)}</td>
                  </tr>
                  <tr className={`table-row ${pnlData.net_profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <td className="px-4 py-3 font-bold">صافي الربح / الخسارة</td>
                    <td className={`px-4 py-3 font-bold text-lg ${pnlData.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pnlData.net_profit >= 0 ? '+' : ''}{formatMoney(pnlData.net_profit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const equipmentContent = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-right">المعدة</th>
              <th className="px-4 py-3 text-right">الكود</th>
              <th className="px-4 py-3 text-right">عدد العقود</th>
              <th className="px-4 py-3 text-right">إجمالي العقود</th>
              <th className="px-4 py-3 text-right">إجمالي الفواتير</th>
              <th className="px-4 py-3 text-right">سندات قبض</th>
              <th className="px-4 py-3 text-right">سندات صرف</th>
              <th className="px-4 py-3 text-right">إجمالي المصروفات</th>
              <th className="px-4 py-3 text-right">صافي الربح</th>
            </tr>
          </thead>
          <tbody>
            {equipmentData.map((row) => (
              <tr key={row.equipment_id} className="table-row">
                <td className="px-4 py-3 font-medium">{row.equipment_name}</td>
                <td className="px-4 py-3 font-mono text-sm">{row.equipment_code}</td>
                <td className="px-4 py-3">{row.contracts_count}</td>
                <td className="px-4 py-3">{formatMoney(row.total_contracts)}</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">{formatMoney(row.total_invoices)}</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">{formatMoney(row.voucher_revenue)}</td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{formatMoney(row.voucher_expenses)}</td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{formatMoney(row.total_expenses)}</td>
                <td className={`px-4 py-3 font-bold ${row.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {row.net_profit >= 0 ? '+' : ''}{formatMoney(row.net_profit)}
                </td>
              </tr>
            ))}
            {equipmentData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <PackageOpen className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد بيانات للمعدات</p>
                    <p className="text-slate-300 text-sm mt-1">اختر فترة زمنية مختلفة أو معدة محددة</p>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const contractsContent = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-right">رقم العقد</th>
              <th className="px-4 py-3 text-right">العميل</th>
              <th className="px-4 py-3 text-right">المعدة</th>
              <th className="px-4 py-3 text-right">النوع</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {contractsData.map((c, i) => (
              <tr key={i} className="table-row">
                <td className="px-4 py-3 font-mono text-sm">{c.contract_number}</td>
                <td className="px-4 py-3">{c.client_name}</td>
                <td className="px-4 py-3">{c.equipment_name}</td>
                <td className="px-4 py-3">{contractTypeLabels[c.contract_type] || c.contract_type}</td>
                <td className="px-4 py-3 font-medium">{formatMoney(c.total_amount)}</td>
                <td className="px-4 py-3"><span className={`badge ${contractStatusColors[c.status] || ''}`}>{contractStatusLabels[c.status] || c.status}</span></td>
              </tr>
            ))}
            {contractsData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Receipt className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد عقود في هذه الفترة</p>
                    <p className="text-slate-300 text-sm mt-1">جرب تغيير فترة التاريخ</p>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const expensesContent = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المعدة</th>
              <th className="px-4 py-3 text-right">الفئة</th>
              <th className="px-4 py-3 text-right">الوصف</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {expensesData.map((exp, i) => (
              <tr key={i} className="table-row">
                <td className="px-4 py-3 text-sm">{exp.date}</td>
                <td className="px-4 py-3">{exp.equipment_name || '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-yellow">{exp.category}</span></td>
                <td className="px-4 py-3">{exp.description}</td>
                <td className="px-4 py-3 font-medium text-red-500">{formatMoney(exp.amount)}</td>
              </tr>
            ))}
            {expensesData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Inbox className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">لا توجد مصروفات في هذه الفترة</p>
                    <p className="text-slate-300 text-sm mt-1">جرب تغيير فترة التاريخ</p>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">التقارير</h1>
            <p className="text-slate-500 dark:text-slate-400">تقارير الأرباح والمصروفات والأداء</p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-wrap items-end gap-4">
        {dateRangePicker}
        {activeTab === 'equipment' && equipmentFilterDropdown}
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
          <Printer className="w-4 h-4" /> طباعة / تصدير
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.key
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-b-0 border-slate-200 dark:border-slate-700 -mb-px'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'pnl' && pnlContent}
      {activeTab === 'equipment' && equipmentContent}
      {activeTab === 'contracts' && contractsContent}
       {activeTab === 'expenses' && expensesContent}
      <button onClick={() => navigate('/customer-statement')} className="fixed bottom-6 left-6 btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50 no-print">
        <FileText className="w-6 h-6" />
      </button>
    </div>
  )
}

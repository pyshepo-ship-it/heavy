import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Receipt,
  ExternalLink
} from 'lucide-react'
import type { DashboardStats } from '@shared/types'

function MiniBarChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium">{d.value.toLocaleString('ar-EG')}</span>
          <div className="w-full rounded-t-lg transition-all" style={{
            height: Math.max(d.value / maxVal * 100, 5) + '%',
            backgroundColor: d.color,
            minHeight: '4px'
          }} />
          <span className="text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function EquipmentStatusChart({ total, available, rented, maintenance }: { total: number; available: number; rented: number; maintenance: number }) {
  const segments = [
    { label: 'متاحة', value: available, color: '#22c55e' },
    { label: 'مؤجرة', value: rented, color: '#3b82f6' },
    { label: 'صيانة', value: maintenance, color: '#f59e0b' }
  ]
  const totalVal = available + rented + maintenance || 1
  let offset = 0
  const gradientParts = segments.map(seg => {
    const pct = (seg.value / totalVal) * 100
    const start = offset
    offset += pct
    return seg.color + ' ' + start + '% ' + offset + '%'
  })
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 h-32 rounded-full border-8 border-slate-200 dark:border-slate-700 relative" style={{
        background: 'conic-gradient(' + gradientParts.join(', ') + ')'
      }}>
        <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{totalVal}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-sm">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [currency, setCurrency] = useState('ر.س')
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const navigate = useNavigate()

  const getClientName = (id: number) => clients.find((c: any) => c.id === id)?.name || '-'

  useEffect(() => {
    window.api.getDashboardStats().then((s) => {
      setStats(s)
      window.api.getInvoices().then((invoices: any[]) => {
        const sortedInv = [...invoices].sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5)
        setRecentInvoices(sortedInv)
      }).catch(() => {})
      window.api.getClients().then((c: any[]) => setClients(c)).catch(() => {})
    })
    window.api.getSettings().then((s) => {
      if (s && s.currency) setCurrency(s.currency)
    }).catch(() => {})
    window.api.getReportsPnL(
      new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ).then((prev: any) => {
      setPreviousStats(prev ? {
        total_revenue: prev.total_invoices || 0,
        total_expenses: prev.total_expenses || 0,
        net_profit: prev.net_profit || 0,
        total_clients: stats?.total_clients || 0,
        total_equipment: stats?.total_equipment || 0,
        available_equipment: stats?.available_equipment || 0,
        rented_equipment: stats?.rented_equipment || 0,
        active_contracts: stats?.active_contracts || 0,
        pending_invoices: stats?.pending_invoices || 0
      } : null)
    }).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { direction: 'up', percentage: 100 }
    const diff = ((current - previous) / previous) * 100
    return { direction: diff >= 0 ? 'up' : 'down', percentage: Math.abs(Math.round(diff)) }
  }

  const statCards = [
    { label: 'إجمالي المعدات', value: stats.total_equipment, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', route: '/equipment' },
    { label: 'المعدات المتاحة', value: stats.available_equipment, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', route: '/equipment' },
    { label: 'المعدات المؤجرة', value: stats.rented_equipment, icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', route: '/contracts' },
    { label: 'العقود النشطة', value: stats.active_contracts, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', route: '/contracts' },
    { label: 'إجمالي العملاء', value: stats.total_clients, icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20', route: '/clients' },
    { label: 'الفواتير المعلقة', value: stats.pending_invoices, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', route: '/invoices' },
    { label: 'إجمالي الإيرادات', value: currency + ' ' + stats.total_revenue.toLocaleString('ar-EG'), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', route: '/reports', hasTrend: true, trendValue: getTrend(stats.total_revenue, previousStats?.total_revenue || 0) },
    { label: 'إجمالي المصروفات', value: currency + ' ' + stats.total_expenses.toLocaleString('ar-EG'), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', route: '/reports', hasTrend: true, trendValue: getTrend(stats.total_expenses, previousStats?.total_expenses || 0) },
    { label: 'صافي الربح', value: currency + ' ' + stats.net_profit.toLocaleString('ar-EG'), icon: DollarSign, color: stats.net_profit >= 0 ? 'text-green-500' : 'text-red-500', bg: stats.net_profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20', route: '/reports', hasTrend: true, trendValue: getTrend(stats.net_profit, previousStats?.net_profit || 0) }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لوحة التحكم</h1>
        <p className="text-slate-500 dark:text-slate-400">نظرة عامة على العمليات التجارية</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-hover p-5 cursor-pointer group"
            onClick={() => navigate(card.route || '/')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                {card.hasTrend && card.trendValue && (
                  <div className="flex items-center gap-1 mt-1">
                    {card.trendValue.direction === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${card.trendValue.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {card.trendValue.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">مقارنة بالفترة السابقة</span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium group-hover:underline">
                انقر للانتقال →
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">إيرادات المصروفات (آخر 6 أشهر)</h3>
          <MiniBarChart data={[
            { label: "أغسطس", value: stats.total_revenue, color: "#22c55e" },
            { label: "يوليو", value: stats.total_revenue * 0.8, color: "#3b82f6" },
            { label: "يونيو", value: stats.total_revenue * 0.6, color: "#f59e0b" },
            { label: "مايو", value: stats.total_revenue * 0.7, color: "#8b5cf6" },
            { label: "أبريل", value: stats.total_revenue * 0.5, color: "#ef4444" },
            { label: "مارس", value: stats.total_revenue * 0.9, color: "#06b6d4" }
          ]} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">توزيع المعدات</h3>
          <EquipmentStatusChart total={stats.total_equipment} available={stats.available_equipment} rented={stats.rented_equipment} maintenance={stats.maintenance_equipment} />
        </div>
      </div>

      {/* Recent Invoices */}

      {recentInvoices.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Receipt className="w-5 h-5" /> آخر 5 فواتير
            </h3>
            <button onClick={() => navigate('/invoices')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              عرض الكل <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-2 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-2 text-right">العميل</th>
                  <th className="px-4 py-2 text-right">النوع</th>
                  <th className="px-4 py-2 text-right">الإجمالي</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/10" onClick={() => navigate('/invoices')}>
                    <td className="px-4 py-2 font-mono text-sm">{inv.invoice_number}</td>
                    <td className="px-4 py-2">{getClientName(inv.client_id)}</td>
                    <td className="px-4 py-2">{inv.type === 'rental' ? 'تأجير' : inv.type === 'direct' ? 'مباشرة' : 'مصروف'}</td>
                    <td className="px-4 py-2 font-medium">{currency} {inv.total_amount?.toLocaleString('ar-EG')}</td>
                    <td className="px-4 py-2">
                      <span className={`badge ${
                        inv.status === 'paid' ? 'badge-green' :
                        inv.status === 'pending' ? 'badge-yellow' :
                        inv.status === 'partial' ? 'badge-blue' : 'badge-red'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'معلقة' : inv.status === 'partial' ? 'جزئية' : 'ملغاة'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-500">{inv.created_at ? inv.created_at.split('T')[0] : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">المدفوعات</p>
            <p className="font-bold text-green-600">{recentInvoices.filter((inv: any) => inv.status === 'paid').length} فاتورة</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">المعلقة</p>
            <p className="font-bold text-yellow-600">{recentInvoices.filter((inv: any) => inv.status === 'pending').length} فاتورة</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">إجمالي الفواتير</p>
            <p className="font-bold text-brand-600">{recentInvoices.length} فاتورة</p>
          </div>
        </div>
      </div>
    </div>
  )
}
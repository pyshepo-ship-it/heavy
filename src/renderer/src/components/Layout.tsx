import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { useLicenseStore } from '../store/useLicenseStore'
import {
  LayoutDashboard, Truck, Users, FileText, Receipt,
  ShoppingCart, Wallet, UserCog, Landmark, Briefcase,
  Info, Sun, Moon, Monitor, Menu, X, Shield, Car, Banknote, Calculator,
  BarChart3, Settings
} from 'lucide-react'

const sections = [
  {
    label: 'الرئيسية',
    items: [
      { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: '/equipment', label: 'المعدات', icon: Truck },
      { to: '/clients', label: 'العملاء', icon: Users },
    ]
  },
  {
    label: 'العمليات',
    items: [
      { to: '/contracts', label: 'العقود', icon: FileText },
      { to: '/invoices', label: 'الفواتير', icon: Receipt },
      { to: '/purchases', label: 'المشتريات', icon: ShoppingCart },
      { to: '/expenses', label: 'المصروفات', icon: Wallet },
    ]
  },
  {
    label: 'الإدارة',
    items: [
      { to: '/employees', label: 'الموظفين', icon: UserCog },
      { to: '/banks', label: 'البنوك والخزائن', icon: Landmark },
      { to: '/custody', label: 'العهد', icon: Briefcase },
      { to: '/drivers', label: 'السائقين', icon: Car },
      { to: '/salaries', label: 'الرواتب', icon: Banknote },
      { to: '/payroll', label: 'مسيرات الرواتب', icon: Calculator },
    ]
  },
  {
    label: 'التقارير والإعدادات',
    items: [
      { to: '/reports', label: 'التقارير', icon: BarChart3 },
      { to: '/customer-statement', label: 'كشف حساب عميل', icon: FileText },
      { to: '/settings', label: 'الإعدادات', icon: Settings },
    ]
  },
  {
    label: '',
    items: [
      { to: '/about', label: 'حول التطبيق', icon: Info },
    ]
  }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useThemeStore()
  const { license } = useLicenseStore()

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const idx = themes.indexOf(theme)
    setTheme(themes[(idx + 1) % themes.length])
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const themeLabels: Record<string, string> = { light: 'فاطح', dark: 'داكن', system: 'النظام' }

  const asideClass = (sidebarOpen ? 'w-64' : 'w-16') + ' bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300'
  const navLinkClass = (isActive: boolean) => 'sidebar-link ' + (isActive ? 'sidebar-link-active' : '') + ' ' + (!sidebarOpen ? 'justify-center px-2' : '')
  const themeBtnClass = 'sidebar-link w-full ' + (!sidebarOpen ? 'justify-center px-2' : '')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={asideClass}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Truck className="w-7 h-7 text-brand-500" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">إدارة المعدات</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={si}>
              {sidebarOpen && section.label && (
                <div className="px-4 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{section.label}</div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => navLinkClass(isActive)} title={item.label}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={cycleTheme} className={themeBtnClass} title={themeLabels[theme]}>
            <ThemeIcon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>{themeLabels[theme]}</span>}
          </button>
          {sidebarOpen && license && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                <span>{license.is_trial ? 'تجريبي' : 'مرخص'} · {license.days_remaining} يوم متبقي</span>
              </div>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
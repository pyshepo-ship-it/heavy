import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Save, Building2, Receipt, Globe, Printer } from 'lucide-react'

const COUNTRY_OPTIONS = [
  { value: 'SA', label: 'المملكة العربية السعودية', currency: 'ر.س', vatRate: 15 },
  { value: 'AE', label: 'الإمارات', currency: 'درهم', vatRate: 5 },
  { value: 'KW', label: 'الكويت', currency: 'د.ك', vatRate: 0 },
  { value: 'EG', label: 'مصر', currency: 'ج.م', vatRate: 14 },
  { value: 'OTHER', label: 'أخرى', currency: 'عملة محلية', vatRate: 0 },
]

const defaultPrintSettings = {
  template: 'modern' as 'modern' | 'classic' | 'compact' | 'elegant' | 'thermal',
  paper: 'A4' as 'A4' | 'A5' | 'Letter',
  orientation: 'portrait' as 'portrait' | 'landscape',
  accent_color: '#2563eb',
  show_logo: true,
  show_company_name: true,
  show_tax_number: true,
  show_commercial_reg: true,
  show_address: true,
  show_phone: true,
  show_footer: true,
  footer_text: '',
  font_size: 12
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    company_name_en: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    tax_number: '',
    commercial_reg: '',
    unified_number: '',
    country: 'SA',
    currency: 'ر.س',
    vat_rate: 15,
    vat_note: '',
    footer_text: '',
    font_size: 12,
    print_settings: JSON.stringify(defaultPrintSettings),
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await window.api.getSettings()
      if (settings) {
        setForm(prev => ({ ...prev, ...settings }))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPrintSettings = () => {
    try {
      return { ...defaultPrintSettings, ...JSON.parse(form.print_settings || '{}') }
    } catch {
      return defaultPrintSettings
    }
  }
  const printSettings = getPrintSettings()

  const updatePrintSettings = (patch: Partial<typeof defaultPrintSettings>) => {
    setForm(prev => ({
      ...prev,
      print_settings: JSON.stringify({ ...getPrintSettings(), ...patch })
    }))
  }

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_OPTIONS.find(c => c.value === countryCode)
    if (country) {
      setForm(prev => ({
        ...prev,
        country: countryCode,
        currency: country.currency,
        vat_rate: countryCode === 'OTHER' ? 0 : country.vatRate,
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.saveSettings(form)
      alert('تم حفظ الإعدادات بنجاح')
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 dark:text-slate-400">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            الإعدادات
          </h1>
          <p className="text-slate-500 dark:text-slate-400">إعدادات النظام العامة</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* Section 1: معلومات الشركة */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">معلومات الشركة</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الشركة بالعربي</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="input-field"
              placeholder="اسم الشركة بالعربي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">اسم الشركة بالإنجليزي</label>
            <input
              type="text"
              value={form.company_name_en}
              onChange={(e) => setForm({ ...form, company_name_en: e.target.value })}
              className="input-field"
              placeholder="Company Name (English)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الهاتف</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="+966XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="info@company.com"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">العنوان</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field"
              placeholder="المدينة، الدولة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الموقع الإلكتروني</label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="input-field"
              placeholder="https://www.company.com"
            />
          </div>
        </div>
      </div>

      {/* Section 2: المعلومات الضريبية */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold">المعلومات الضريبية</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">الرقم الضريبي</label>
            <input
              type="text"
              value={form.tax_number}
              onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
              className="input-field"
              placeholder="300XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">السجل التجاري</label>
            <input
              type="text"
              value={form.commercial_reg}
              onChange={(e) => setForm({ ...form, commercial_reg: e.target.value })}
              className="input-field"
              placeholder="101XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الرقم الموحد</label>
            <input
              type="text"
              value={form.unified_number}
              onChange={(e) => setForm({ ...form, unified_number: e.target.value })}
              className="input-field"
              placeholder="الرقم الموحد"
            />
          </div>
        </div>
      </div>

      {/* Section 3: إعدادات العملة والبلد */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">إعدادات العملة والبلد</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">الدولة</label>
            <select
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="select-field"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العملة</label>
            <input
              type="text"
              value={form.currency}
              readOnly
              className="input-field bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نسبة الضريبة (%)</label>
            <input
              type="number"
              value={form.vat_rate}
              onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
              disabled={form.country !== 'OTHER'}
              className={`input-field ${form.country !== 'OTHER' ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : ''}`}
              min={0}
              max={100}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">ملاحظة الضريبة</label>
            <input
              type="text"
              value={form.vat_note}
              onChange={(e) => setForm({ ...form, vat_note: e.target.value })}
              className="input-field"
              placeholder="مثال: شامل الضريبة / زائد عن الضريبة"
            />
          </div>
        </div>
      </div>

      {/* Section 4: إعدادات الطباعة */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Printer className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold">إعدادات الطباعة</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">قالب الفاتورة</label>
            <select
              value={printSettings.template}
              onChange={(e) => updatePrintSettings({ template: e.target.value as typeof defaultPrintSettings.template })}
              className="select-field"
            >
              <option value="modern">مودرن</option>
              <option value="classic">كلاسيك</option>
              <option value="compact">مدمج</option>
              <option value="elegant">أنيق</option>
              <option value="thermal">حراري 80mm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">حجم الورق</label>
            <select
              value={printSettings.paper}
              onChange={(e) => updatePrintSettings({ paper: e.target.value as typeof defaultPrintSettings.paper })}
              className="select-field"
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الاتجاه</label>
            <select
              value={printSettings.orientation}
              onChange={(e) => updatePrintSettings({ orientation: e.target.value as typeof defaultPrintSettings.orientation })}
              className="select-field"
            >
              <option value="portrait">طولى</option>
              <option value="landscape">عرضى</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">اللون الرئيسي</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={printSettings.accent_color}
                onChange={(e) => updatePrintSettings({ accent_color: e.target.value })}
                className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={printSettings.accent_color}
                onChange={(e) => updatePrintSettings({ accent_color: e.target.value })}
                className="input-field w-32"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">حجم خط الطباعة</label>
            <input
              type="number"
              value={printSettings.font_size}
              onChange={(e) => updatePrintSettings({ font_size: Number(e.target.value) })}
              className="input-field"
              min={8}
              max={24}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ['show_logo', 'عرض الشعار'],
            ['show_company_name', 'عرض اسم الشركة'],
            ['show_tax_number', 'عرض الرقم الضريبي'],
            ['show_commercial_reg', 'عرض السجل التجاري'],
            ['show_address', 'عرض العنوان'],
            ['show_phone', 'عرض الهاتف'],
            ['show_footer', 'عرض التذييل'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(printSettings[key])}
                onChange={(e) => updatePrintSettings({ [key]: e.target.checked } as any)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">نص التذييل</label>
            <input
              type="text"
              value={printSettings.footer_text}
              onChange={(e) => updatePrintSettings({ footer_text: e.target.value })}
              className="input-field"
              placeholder="نص يظهر في أسفل الفاتورة"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">ملاحظة الضريبة/Slogan (تُظهر في الفاتورة)</label>
            <input
              type="text"
              value={form.vat_note}
              onChange={(e) => setForm({ ...form, vat_note: e.target.value })}
              className="input-field"
              placeholder="مثال: شامل ضريبة القيمة المضافة 15%"
            />
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}

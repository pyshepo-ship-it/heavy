import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLicenseStore } from '../store/useLicenseStore'
import { Info, Shield, Key, Copy, Check, ExternalLink, Truck, RefreshCw } from 'lucide-react'
import type { AboutData } from '@shared/types'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://your-worker.your-subdomain.workers.dev'

function defaultAboutData(): AboutData {
  return {
    announcement: 'مرحباً بكم في نظام إدارة تأجير المعدات الثقيلة',
    version: '1.0.0',
    support_link: 'https://t.me/your_support_bot',
    status_message: 'النظام يعمل بكفاءة عالية'
  }
}

export default function About() {
  const { license, activateLicense, getDeviceId } = useLicenseStore()
  const [aboutData, setAboutData] = useState<AboutData | null>(null)
  const [activationCode, setActivationCode] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    getDeviceId().then(setDeviceId)
    fetchAboutData()
  }, [])

  const fetchAboutData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/about`)
      if (res.ok) {
        const data = await res.json()
        setAboutData(data)
      } else {
        setAboutData(defaultAboutData())
      }
    } catch {
      setAboutData(defaultAboutData())
    }
  }

  const fetchActivationSupportLink = () => {
    // Keep local; support_link comes from the main fetchAboutData too.
  }

  const handleActivate = async () => {
    if (!activationCode.trim()) return
    const result = await activateLicense(activationCode.trim())
    setMessage(result.message)
    setIsSuccess(result.success)
    if (result.success) setActivationCode('')
  }

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">حول التطبيق</h1>
        <p className="text-slate-500 dark:text-slate-400">معلومات الترخيص والتحديثات</p>
      </div>

      {/* License Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">معلومات الترخيص</h2>
            <p className="text-sm text-slate-500">حالة اشتراكك</p>
          </div>
        </div>

        {license && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">نوع الترخيص</p>
                <p className="font-semibold">{license.is_trial ? 'نسخة تجريبية' : 'مرخص'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">الأيام المتبقية</p>
                <p className={`font-semibold ${license.days_remaining <= 3 ? 'text-red-500' : 'text-green-500'}`}>
                  {license.days_remaining} يوم
                </p>
              </div>
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">معرف الجهاز</label>
              <div className="flex gap-2">
                <input readOnly value={deviceId} className="input-field flex-1 text-xs font-mono" />
                <button onClick={copyDeviceId} className="btn-secondary px-3">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Activation Code Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">إدخال كود التفعيل</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="HERP-XXXX-XXXX-XXXX-XXXX"
                    className="input-field pr-10 font-mono text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                  />
                </div>
                <button onClick={handleActivate} className="btn-primary">تفعيل</button>
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm ${
                  isSuccess ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}
              >
                {message}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Dynamic Announcements */}
      {aboutData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold text-lg">الأخبار والإعلانات</h2>
                <p className="text-sm text-slate-500">آخر التحديثات من الفريق</p>
              </div>
            </div>
            <button onClick={fetchAboutData} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="تحديث">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-lg">
              <p className="text-brand-800 dark:text-brand-200">{aboutData.announcement}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500">الإصدار</p>
                <p className="font-medium">{aboutData.version}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500">الحالة</p>
                <p className="font-medium text-green-500">{aboutData.status_message}</p>
              </div>
            </div>

            {aboutData.support_link && (
              <a
                href={aboutData.support_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">تواصل مع الدعم الفني عبر التليجرام</span>
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* App Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">نظام إدارة تأجير المعدات الثقيلة</h2>
            <p className="text-sm text-slate-500">حل متكامل لإدارة التأجير</p>
          </div>
        </div>
        <div className="text-sm text-slate-500 space-y-1">
          <p>Electron + React + TypeScript + Tailwind CSS</p>
          <p>قاعدة بيانات SQLite محلية + تكامل Cloudflare Workers</p>
        </div>
      </motion.div>
    </div>
  )
}

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLicenseStore } from '../store/useLicenseStore'
import { X, Shield, Key, Copy, Check } from 'lucide-react'

export default function LicenseModal() {
  const { activateLicense, getDeviceId } = useLicenseStore()
  const [code, setCode] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  React.useEffect(() => {
    getDeviceId().then(setDeviceId)
  }, [])

  const handleActivate = async () => {
    if (!code.trim()) return
    const result = await activateLicense(code.trim())
    setMessage(result.message)
    setIsSuccess(result.success)
  }

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md mx-4 card p-0 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-brand-500 to-brand-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">انتهت صلاحية الترخيص</h2>
                  <p className="text-sm text-white/80">التفعيل مطلوب</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                معرف الجهاز (أرسله للدعم الفني)
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={deviceId}
                  className="input-field flex-1 text-xs font-mono"
                />
                <button onClick={copyDeviceId} className="btn-secondary px-3">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Activation Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                كود التفعيل
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="HERP-XXXX-XXXX-XXXX-XXXX"
                    className="input-field pr-10 font-mono text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                  />
                </div>
                <button onClick={handleActivate} className="btn-primary">
                  تفعيل
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm ${
                  isSuccess
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}
              >
                {isSuccess ? message : 'كود التفعيل غير صالح'}
              </motion.div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              تواصل مع الدعم الفني عبر التليجرام للحصول على كود التفعيل
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

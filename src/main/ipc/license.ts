import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { getHardwareFingerprint } from '../utils/hwid'
import type { LicenseInfo } from '@shared/types'

function decryptCode(code: string): { client: string; days: number; created_at: number; nonce: string } | null {
  try {
    const jsonStr = Buffer.from(code, 'base64').toString('utf-8')
    const payload = JSON.parse(jsonStr)
    if (payload.client && payload.days && payload.created_at) {
      return payload
    }
    return null
  } catch {
    return null
  }
}

function generateHardwareFingerprint(): string {
  return getHardwareFingerprint()
}

export function registerLicenseHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('license:check', (): LicenseInfo | null => {
    const existing = db.prepare('SELECT * FROM license_info ORDER BY id DESC LIMIT 1').get() as LicenseInfo | undefined

    if (existing) {
      const expiryDate = new Date(existing.expiry_date)
      const now = new Date()
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysRemaining <= 0) {
        return { ...existing, days_remaining: 0 }
      }
      return { ...existing, days_remaining: daysRemaining }
    }

    const deviceId = generateHardwareFingerprint()
    const trialExpiry = new Date()
    trialExpiry.setDate(trialExpiry.getDate() + 7)

    db.prepare(`
      INSERT INTO license_info (device_id, activation_code, activated_at, expiry_date, is_trial, days_remaining)
      VALUES (?, '', datetime('now'), ?, 1, 7)
    `).run(deviceId, trialExpiry.toISOString())

    return {
      id: 1,
      device_id: deviceId,
      activation_code: '',
      activated_at: new Date().toISOString(),
      expiry_date: trialExpiry.toISOString(),
      is_trial: true,
      days_remaining: 7,
      created_at: new Date().toISOString()
    }
  })

  ipcMain.handle('license:activate', (_, code: string): { success: boolean; message: string } => {
    const payload = decryptCode(code)
    if (!payload) {
      return { success: false, message: 'تنسيق كود التفعيل غير صالح' }
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + payload.days)

    const existing = db.prepare('SELECT * FROM license_info ORDER BY id DESC LIMIT 1').get() as LicenseInfo | undefined

    if (existing) {
      db.prepare(`
        UPDATE license_info
        SET activation_code = ?, expiry_date = ?, is_trial = 0, days_remaining = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(code, expiryDate.toISOString(), payload.days, existing.id)
    } else {
      const deviceId = generateHardwareFingerprint()
      db.prepare(`
        INSERT INTO license_info (device_id, activation_code, activated_at, expiry_date, is_trial, days_remaining)
        VALUES (?, ?, datetime('now'), ?, 0, ?)
      `).run(deviceId, code, expiryDate.toISOString(), payload.days)
    }

    return { success: true, message: 'تم التفعيل بنجاح لمدة ' + payload.days + ' يوم' }
  })

  ipcMain.handle('license:getDeviceId', (): string => {
    const existing = db.prepare('SELECT * FROM license_info ORDER BY id DESC LIMIT 1').get() as LicenseInfo | undefined
    if (existing) return existing.device_id

    const deviceId = generateHardwareFingerprint()
    const trialExpiry = new Date()
    trialExpiry.setDate(trialExpiry.getDate() + 7)

    db.prepare(`
      INSERT INTO license_info (device_id, activation_code, activated_at, expiry_date, is_trial, days_remaining)
      VALUES (?, '', datetime('now'), ?, 1, 7)
    `).run(deviceId, trialExpiry.toISOString())

    return deviceId
  })
}
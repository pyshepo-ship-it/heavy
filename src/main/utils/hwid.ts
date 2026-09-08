import { execSync } from 'child_process'
import crypto from 'crypto'

export function getHardwareFingerprint(): string {
  try {
    let raw = ''

    // Try to get UUID via PowerShell (modern Windows)
    try {
      const uuid = execSync('powershell -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', { encoding: 'utf-8', timeout: 5000 }).trim()
      if (uuid && !uuid.includes('error')) raw += uuid
    } catch {
      // fallback
    }

    // Try to get disk serial via PowerShell
    if (!raw) {
      try {
        const disk = execSync('powershell -Command "(Get-CimInstance Win32_DiskDrive | Select-Object -First 1).SerialNumber"', { encoding: 'utf-8', timeout: 5000 }).trim()
        if (disk && !disk.includes('error')) raw += disk
      } catch {
        // fallback
      }
    }

    // Try hostname + username as fallback
    if (!raw) {
      try {
        raw = execSync('whoami', { encoding: 'utf-8', timeout: 3000 }).trim()
      } catch {
        // final fallback
      }
    }

    if (!raw) {
      raw = `${Date.now()}-${Math.random().toString(36)}-${process.platform}`
    }

    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32)
  } catch {
    return crypto.createHash('sha256').update(`${Date.now()}-${process.platform}`).digest('hex').substring(0, 32)
  }
}

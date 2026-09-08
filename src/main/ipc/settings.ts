import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { AppSettings } from '@shared/types'

export function registerSettingsHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('settings:get', (): AppSettings | undefined => {
    return db.prepare('SELECT * FROM app_settings LIMIT 1').get() as AppSettings | undefined
  })

  const allowedColumns = new Set([
    'company_name', 'company_name_en', 'phone', 'email', 'address', 'website',
    'tax_number', 'commercial_reg', 'unified_number', 'country', 'currency',
    'vat_rate', 'vat_note', 'print_settings', 'logo_path', 'footer_text', 'font_size'
  ])

  ipcMain.handle('settings:save', (_, settings: Partial<AppSettings>): boolean => {
    const entries = Object.entries(settings).filter(([key]) => allowedColumns.has(key))
    if (entries.length === 0) return true
    const existing = db.prepare('SELECT id FROM app_settings LIMIT 1').get() as { id: number } | undefined
    if (existing) {
      const fields: string[] = []
      const values: unknown[] = []
      entries.forEach(([key, value]) => {
        fields.push(key + ' = ?')
        values.push(value)
      })
      fields.push("updated_at = datetime('now')")
      values.push(existing.id)
      db.prepare('UPDATE app_settings SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)
    } else {
      const keys = entries.map(([k]) => k)
      const placeholders = keys.map(() => '?').join(', ')
      const vals = entries.map(([, v]) => v)
      db.prepare('INSERT INTO app_settings (' + keys.join(', ') + ') VALUES (' + placeholders + ')').run(...vals)
    }
    return true
  })

  ipcMain.handle('settings:getCurrency', (): string => {
    const row = db.prepare('SELECT currency FROM app_settings LIMIT 1').get() as { currency: string } | undefined
    return row ? row.currency : 'ر.س'
  })

  ipcMain.handle('settings:getVatRate', (): number => {
    const row = db.prepare('SELECT vat_rate FROM app_settings LIMIT 1').get() as { vat_rate: number } | undefined
    return row ? row.vat_rate : 15
  })
}
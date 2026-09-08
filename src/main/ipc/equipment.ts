import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Equipment } from '@shared/types'

const TYPE_PREFIXES: Record<string, string> = {
  'حفار': 'EXC',
  'لوادر': 'LDR',
  'كرين': 'CRN',
  'مولد': 'GEN',
  'بلدوزر': 'BLD',
  'كومانداتور': 'CMD',
  'باكهو': 'BKH',
  'فوركليفت': 'FKL',
  'أخرى': 'OTH'
}

export function registerEquipmentHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('equipment:getAll', (): Equipment[] => {
    return db.prepare('SELECT * FROM equipment ORDER BY created_at DESC').all() as Equipment[]
  })

  ipcMain.handle('equipment:getById', (_, id: number): Equipment | undefined => {
    return db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as Equipment | undefined
  })

  const allowedColumns = new Set(['code', 'name', 'type', 'current_meter', 'hourly_rate', 'daily_rate', 'monthly_rate', 'status', 'notes'])

  ipcMain.handle('equipment:create', (_, equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): number => {
    const prefix = TYPE_PREFIXES[equipment.type] || 'OTH'
    const maxRow = db.prepare('SELECT MAX(id) as maxId FROM equipment WHERE type = ?').get(equipment.type) as { maxId: number | null }
    const code = `${prefix}-${String(Number(maxRow?.maxId ?? 0) + 1).padStart(3, '0')}`

    const result = db.prepare(`
      INSERT INTO equipment (code, name, type, current_meter, hourly_rate, daily_rate, monthly_rate, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, equipment.name, equipment.type, equipment.current_meter, equipment.hourly_rate, equipment.daily_rate, equipment.monthly_rate, equipment.status, equipment.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('equipment:update', (_, id: number, equipment: Partial<Equipment>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []

    Object.entries(equipment).forEach(([key, value]) => {
      if (allowedColumns.has(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)

    db.prepare(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('equipment:delete', (_, id: number): boolean => {
    const activeContract = db.prepare("SELECT id FROM rental_contracts WHERE equipment_id = ? AND status = 'active'").get(id)
    if (activeContract) throw new Error('لا يمكن حذف المعدة لوجود عقد نشط')

    const refs = db.prepare(
      `SELECT (SELECT COUNT(*) FROM rental_contracts WHERE equipment_id = ?) +
              (SELECT COUNT(*) FROM invoices WHERE equipment_id = ?) +
              (SELECT COUNT(*) FROM expenses WHERE equipment_id = ?) +
              (SELECT COUNT(*) FROM drivers WHERE equipment_id = ?) as c`
    ).get(id, id, id, id) as { c: number }
    if (refs.c > 0) throw new Error('لا يمكن حذف المعدة لوجود عقود أو فواتير أو مصروفات أو سائقين مرتبطين بها')

    db.prepare('DELETE FROM equipment WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('equipment:updateMeter', (_, id: number, meter: number): boolean => {
    db.prepare("UPDATE equipment SET current_meter = ?, updated_at = datetime('now') WHERE id = ?").run(meter, id)
    return true
  })
}

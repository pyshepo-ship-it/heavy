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

  ipcMain.handle('equipment:create', (_, equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): number => {
    const prefix = TYPE_PREFIXES[equipment.type] || 'OTH'
    const count = (db.prepare('SELECT COUNT(*) as c FROM equipment WHERE type = ?').get(equipment.type) as { c: number }).c
    const code = `${prefix}-${String(count + 1).padStart(3, '0')}`

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
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    fields.push("updated_at = datetime('now')")
    values.push(id)

    db.prepare(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('equipment:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM equipment WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('equipment:updateMeter', (_, id: number, meter: number): boolean => {
    db.prepare("UPDATE equipment SET current_meter = ?, updated_at = datetime('now') WHERE id = ?").run(meter, id)
    return true
  })
}

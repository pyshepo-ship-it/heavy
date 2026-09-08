import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Driver } from '@shared/types'

export function registerDriverHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('drivers:getAll', (): Driver[] => {
    return db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all() as Driver[]
  })

  ipcMain.handle('drivers:getById', (_, id: number): Driver | undefined => {
    return db.prepare('SELECT * FROM drivers WHERE id = ?').get(id) as Driver | undefined
  })

  ipcMain.handle('drivers:create', (_, driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): number => {
    const result = db.prepare(`
      INSERT INTO drivers (name, phone, employee_id, daily_wage, overtime_rate, equipment_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(driver.name, driver.phone, driver.employee_id, driver.daily_wage, driver.overtime_rate, driver.equipment_id, driver.notes)
    return Number(result.lastInsertRowid)
  })

  const allowedColumns = new Set(['name', 'phone', 'employee_id', 'daily_wage', 'overtime_rate', 'equipment_id', 'notes'])

  ipcMain.handle('drivers:update', (_, id: number, driver: Partial<Driver>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []

    Object.entries(driver).forEach(([key, value]) => {
      if (allowedColumns.has(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)

    db.prepare(`UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('drivers:delete', (_, id: number): boolean => {
    const refs = db.prepare('SELECT COUNT(*) as c FROM rental_contracts WHERE driver_id = ?').get(id) as { c: number }
    if (refs.c > 0) throw new Error('لا يمكن حذف السائق لوجود عقود مرتبطة به')
    db.prepare('DELETE FROM drivers WHERE id = ?').run(id)
    return true
  })
}

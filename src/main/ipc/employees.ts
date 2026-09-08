import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Employee } from '@shared/types'

export function registerEmployeeHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('employees:getAll', (): Employee[] => {
    return db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all() as Employee[]
  })

  ipcMain.handle('employees:getById', (_, id: number): Employee | undefined => {
    return db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as Employee | undefined
  })

  ipcMain.handle('employees:create', (_, emp: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): number => {
    const result = db.prepare(`
      INSERT INTO employees (name, phone, role, salary, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(emp.name, emp.phone, emp.role, emp.salary, emp.status, emp.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('employees:update', (_, id: number, emp: Partial<Employee>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []
    Object.entries(emp).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('employees:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id)
    return true
  })
}

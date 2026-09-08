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

  const allowedColumns = new Set(['name', 'phone', 'role', 'salary', 'status', 'notes'])

  ipcMain.handle('employees:update', (_, id: number, emp: Partial<Employee>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []
    Object.entries(emp).forEach(([key, value]) => {
      if (allowedColumns.has(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })
    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('employees:delete', (_, id: number): boolean => {
    const refs = db.prepare(
      `SELECT (SELECT COUNT(*) FROM drivers WHERE employee_id = ?) +
              (SELECT COUNT(*) FROM salary_payments WHERE employee_id = ?) +
              (SELECT COUNT(*) FROM salary_advances WHERE employee_id = ?) +
              (SELECT COUNT(*) FROM salary_deductions WHERE employee_id = ?) +
              (SELECT COUNT(*) FROM payroll_items WHERE employee_id = ?) as c`
    ).get(id, id, id, id, id) as { c: number }
    if (refs.c > 0) throw new Error('لا يمكن حذف الموظف لوجود سجلات مرتبطة (سائق/رواتب/سلف)')
    db.prepare('DELETE FROM employees WHERE id = ?').run(id)
    return true
  })
}

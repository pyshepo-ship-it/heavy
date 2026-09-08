import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { SalaryPayment, SalaryAdvance, SalaryDeduction } from '@shared/types'

export function registerSalaryHandlers(): void {
  const db = getDatabase()

  const paymentSelect = `
    SELECT sp.id as id,
      sp.employee_id as employeeId,
      e.name as employeeName,
      sp.month as month,
      sp.base_salary as baseSalary,
      sp.overtime_hours as overtimeHours,
      sp.overtime_amount as overtimeAmount,
      sp.bonus as bonus,
      sp.advances_total as totalAdvances,
      sp.deductions_total as totalDeductions,
      sp.net_salary as netSalary,
      sp.status as status,
      sp.payment_date as paidAt
    FROM salary_payments sp
    LEFT JOIN employees e ON sp.employee_id = e.id
  `

  const advanceSelect = `
    SELECT sa.id as id,
      sa.employee_id as employeeId,
      e.name as employeeName,
      sa.amount as amount,
      sa.description as description,
      sa.date as date,
      sa.is_deducted as deducted
    FROM salary_advances sa
    LEFT JOIN employees e ON sa.employee_id = e.id
  `

  const deductionSelect = `
    SELECT sd.id as id,
      sd.employee_id as employeeId,
      e.name as employeeName,
      sd.type as type,
      sd.amount as amount,
      sd.description as description,
      sd.date as date,
      sd.is_applied as applied
    FROM salary_deductions sd
    LEFT JOIN employees e ON sd.employee_id = e.id
  `

  const pick = (obj: any, ...keys: string[]): any => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k]
    }
    return undefined
  }

  // === SALARY PAYMENTS ===
  ipcMain.handle('salaryPayments:getAll', () => {
    return db.prepare(paymentSelect + ' ORDER BY sp.created_at DESC').all()
  })

  ipcMain.handle('salaryPayments:getByMonth', (_, month: string) => {
    return db.prepare(paymentSelect + ' WHERE sp.month = ? ORDER BY sp.created_at DESC').all(month)
  })

  ipcMain.handle('salaryPayments:create', (_, payment: any): number => {
    const count = (db.prepare('SELECT COUNT(*) as c FROM salary_payments').get() as { c: number }).c
    const paymentNumber = `SAL-${String(count + 1).padStart(5, '0')}`

    const result = db.prepare(`
      INSERT INTO salary_payments (payment_number, employee_id, month, base_salary, overtime_hours, overtime_rate, overtime_amount, bonus, advances_total, deductions_total, net_salary, status, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentNumber,
      pick(payment, 'employee_id', 'employeeId') || 0,
      pick(payment, 'month') || '',
      pick(payment, 'base_salary', 'baseSalary') || 0,
      pick(payment, 'overtime_hours', 'overtimeHours') || 0,
      pick(payment, 'overtime_rate', 'overtimeRate') || 0,
      pick(payment, 'overtime_amount', 'overtimeAmount') || 0,
      pick(payment, 'bonus') || 0,
      pick(payment, 'advances_total', 'totalAdvances') || 0,
      pick(payment, 'deductions_total', 'totalDeductions') || 0,
      pick(payment, 'net_salary', 'netSalary') || 0,
      pick(payment, 'status') || 'pending',
      pick(payment, 'payment_date', 'paidAt') || '',
      pick(payment, 'notes') || ''
    )

    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('salaryPayments:markPaid', (_, id: number): boolean => {
    db.prepare("UPDATE salary_payments SET status = 'paid', payment_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(id)
    return true
  })

  ipcMain.handle('salaryPayments:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM salary_payments WHERE id = ?').run(id)
    return true
  })

  // === SALARY ADVANCES (سلفيات) ===
  ipcMain.handle('salaryAdvances:getAll', (): SalaryAdvance[] => {
    return db.prepare('SELECT * FROM salary_advances ORDER BY created_at DESC').all() as SalaryAdvance[]
  })

  ipcMain.handle('salaryAdvances:getByEmployee', (_, employeeId: number) => {
    return db.prepare(advanceSelect + ' WHERE sa.employee_id = ? AND sa.is_deducted = 0 ORDER BY sa.date DESC').all(employeeId)
  })

  ipcMain.handle('salaryAdvances:getUndeducted', () => {
    return db.prepare(advanceSelect + ' WHERE sa.is_deducted = 0 ORDER BY sa.date DESC').all()
  })

  ipcMain.handle('salaryAdvances:create', (_, advance: any): number => {
    const result = db.prepare(`
      INSERT INTO salary_advances (employee_id, amount, description, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      pick(advance, 'employee_id', 'employeeId') || 0,
      pick(advance, 'amount') || 0,
      pick(advance, 'description') || '',
      pick(advance, 'date') || new Date().toISOString().split('T')[0],
      pick(advance, 'notes') || ''
    )
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('salaryAdvances:markDeducted', (_, id: number, payrollItemId: number): boolean => {
    db.prepare("UPDATE salary_advances SET is_deducted = 1, payroll_item_id = ?, updated_at = datetime('now') WHERE id = ?").run(payrollItemId, id)
    return true
  })

  ipcMain.handle('salaryAdvances:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM salary_advances WHERE id = ?').run(id)
    return true
  })

  // === SALARY DEDUCTIONS (خصومات) ===
  ipcMain.handle('salaryDeductions:getAll', (): SalaryDeduction[] => {
    return db.prepare('SELECT * FROM salary_deductions ORDER BY created_at DESC').all() as SalaryDeduction[]
  })

  ipcMain.handle('salaryDeductions:getByEmployee', (_, employeeId: number) => {
    return db.prepare(deductionSelect + ' WHERE sd.employee_id = ? AND sd.is_applied = 0 ORDER BY sd.date DESC').all(employeeId)
  })

  ipcMain.handle('salaryDeductions:getUnapplied', () => {
    return db.prepare(deductionSelect + ' WHERE sd.is_applied = 0 ORDER BY sd.date DESC').all()
  })

  ipcMain.handle('salaryDeductions:create', (_, deduction: any): number => {
    const result = db.prepare(`
      INSERT INTO salary_deductions (employee_id, type, amount, description, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      pick(deduction, 'employee_id', 'employeeId') || 0,
      pick(deduction, 'type') || '',
      pick(deduction, 'amount') || 0,
      pick(deduction, 'description') || '',
      pick(deduction, 'date') || new Date().toISOString().split('T')[0],
      pick(deduction, 'notes') || ''
    )
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('salaryDeductions:markApplied', (_, id: number, payrollItemId: number): boolean => {
    db.prepare("UPDATE salary_deductions SET is_applied = 1, payroll_item_id = ?, updated_at = datetime('now') WHERE id = ?").run(payrollItemId, id)
    return true
  })

  ipcMain.handle('salaryDeductions:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM salary_deductions WHERE id = ?').run(id)
    return true
  })
}
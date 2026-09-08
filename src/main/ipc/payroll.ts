import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { nextDocNumber } from '../db/helpers'
import type { PayrollRun, PayrollItem, Employee } from '@shared/types'

export function registerPayrollHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('payrollRuns:getAll', (): PayrollRun[] => {
    return db.prepare('SELECT * FROM payroll_runs ORDER BY created_at DESC').all() as PayrollRun[]
  })

  ipcMain.handle('payrollRuns:getById', (_, id: number): PayrollRun | undefined => {
    return db.prepare('SELECT * FROM payroll_runs WHERE id = ?').get(id) as PayrollRun | undefined
  })

  ipcMain.handle('payrollRuns:getItems', (_, runId: number): PayrollItem[] => {
    return db.prepare(`
      SELECT pi.*, e.name as employee_name
      FROM payroll_items pi
      LEFT JOIN employees e ON pi.employee_id = e.id
      WHERE pi.payroll_run_id = ?
      ORDER BY e.name
    `).all(runId) as PayrollItem[]
  })

  ipcMain.handle('payrollRuns:create', (_, month: string, notes: string): { run_id: number; items_created: number } => {
    const existing = db.prepare('SELECT id FROM payroll_runs WHERE month = ?').get(month)
    if (existing) throw new Error('مسيرة رواتب لهذا الشهر موجودة بالفعل')

    const runNumber = nextDocNumber(db, 'payroll_runs', 'PR')

    const runResult = db.prepare(`
      INSERT INTO payroll_runs (run_number, month, status, notes)
      VALUES (?, ?, 'draft', ?)
    `).run(runNumber, month, notes)

    const runId = Number(runResult.lastInsertRowid)

    const employees = db.prepare("SELECT * FROM employees WHERE status = 'active'").all() as Employee[]

    let itemsCreated = 0
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    for (const emp of employees) {
      const advances = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM salary_advances WHERE employee_id = ? AND is_deducted = 0').get(emp.id) as { total: number }

      const deductions = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM salary_deductions WHERE employee_id = ? AND is_applied = 0').get(emp.id) as { total: number }

      const baseSalary = emp.salary
      const advancesTotal = advances.total
      const deductionsTotal = deductions.total
      const netPay = baseSalary - advancesTotal - deductionsTotal

      const itemResult = db.prepare(`
        INSERT INTO payroll_items (payroll_run_id, employee_id, base_salary, overtime_hours, overtime_amount, bonus, advances, deductions, net_pay, status, notes)
        VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, 'pending', '')
      `).run(runId, emp.id, baseSalary, advancesTotal, deductionsTotal, netPay)
      const payrollItemId = Number(itemResult.lastInsertRowid)

      db.prepare('UPDATE salary_advances SET is_deducted = 1, payroll_item_id = ? WHERE employee_id = ? AND is_deducted = 0').run(payrollItemId, emp.id)

      db.prepare('UPDATE salary_deductions SET is_applied = 1, payroll_item_id = ? WHERE employee_id = ? AND is_applied = 0').run(payrollItemId, emp.id)

      totalGross += baseSalary
      totalDeductions += advancesTotal + deductionsTotal
      totalNet += netPay
      itemsCreated++
    }

    db.prepare(`
      UPDATE payroll_runs SET total_employees = ?, total_gross = ?, total_deductions = ?, total_net = ?, updated_at = datetime('now') WHERE id = ?
    `).run(itemsCreated, totalGross, totalDeductions, totalNet, runId)

    return { run_id: runId, items_created: itemsCreated }
  })

  ipcMain.handle('payrollRuns:updateItem', (_, itemId: number, data: Partial<PayrollItem>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'employee_id' && key !== 'payroll_run_id') {
        fields.push(key + ' = ?')
        values.push(value)
      }
    })
    fields.push("updated_at = datetime('now')")
    values.push(itemId)
    db.prepare('UPDATE payroll_items SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)
    return true
  })

  ipcMain.handle('payrollRuns:process', (_, runId: number): boolean => {
    db.prepare("UPDATE payroll_runs SET status = 'processed', processed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(runId)
    return true
  })

  ipcMain.handle('payrollRuns:markPaid', (_, runId: number): boolean => {
    const run = db.prepare('SELECT * FROM payroll_runs WHERE id = ?').get(runId) as PayrollRun | undefined
    if (!run) throw new Error('المسيرة غير موجودة')
    if (run.status === 'paid') return true

    db.prepare("UPDATE payroll_runs SET status = 'paid', updated_at = datetime('now') WHERE id = ?").run(runId)
    db.prepare("UPDATE payroll_items SET status = 'paid', updated_at = datetime('now') WHERE payroll_run_id = ?").run(runId)

    const items = db.prepare('SELECT * FROM payroll_items WHERE payroll_run_id = ?').all(runId) as PayrollItem[]
    for (const item of items) {
      const existing = db.prepare(
        "SELECT id FROM salary_payments WHERE employee_id = ? AND month = ? AND status = 'paid' LIMIT 1"
      ).get(item.employee_id, run.month) as { id: number } | undefined
      if (existing) continue

      const paymentNumber = nextDocNumber(db, 'salary_payments', 'SAL')
      db.prepare(`
        INSERT INTO salary_payments (payment_number, employee_id, month, base_salary, overtime_hours, overtime_rate, overtime_amount, bonus, advances_total, deductions_total, net_salary, status, payment_date, notes)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'paid', date('now'), 'صرف آلي من مسيرة رواتب')
      `).run(paymentNumber, item.employee_id, run.month, item.base_salary, item.overtime_hours, item.overtime_amount, item.bonus, item.advances, item.deductions, item.net_pay)
    }

    return true
  })

  ipcMain.handle('payrollRuns:delete', (_, runId: number): boolean => {
    const run = db.prepare('SELECT status FROM payroll_runs WHERE id = ?').get(runId) as { status: string } | undefined
    if (run && run.status !== 'draft') throw new Error('يمكن حذف المسيرات في حالة مسودة فقط')
    const itemIds = db.prepare('SELECT id FROM payroll_items WHERE payroll_run_id = ?').all(runId) as Array<{ id: number }>
    const ids = itemIds.map(i => i.id)
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(', ')
      db.prepare(`UPDATE salary_advances SET is_deducted = 0, payroll_item_id = NULL WHERE payroll_item_id IN (${placeholders})`).run(...ids)
      db.prepare(`UPDATE salary_deductions SET is_applied = 0, payroll_item_id = NULL WHERE payroll_item_id IN (${placeholders})`).run(...ids)
    }
    db.prepare('DELETE FROM payroll_items WHERE payroll_run_id = ?').run(runId)
    db.prepare('DELETE FROM payroll_runs WHERE id = ?').run(runId)
    return true
  })
}
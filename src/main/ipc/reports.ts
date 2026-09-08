import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'

export function registerReportHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('reports:pnl', (_, dateFrom: string, dateTo: string) => {
    const invoices = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM invoices WHERE status IN ('paid','partial') AND date(created_at) BETWEEN date(?) AND date(?)
    `).get(dateFrom, dateTo) as { revenue: number }

    const expenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE date(date) BETWEEN date(?) AND date(?)
    `).get(dateFrom, dateTo) as { total: number }

    const purchases = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM purchase_invoices WHERE status = 'paid' AND date(date) BETWEEN date(?) AND date(?)
    `).get(dateFrom, dateTo) as { total: number }

    const salaries = db.prepare(`
      SELECT COALESCE(SUM(net_salary), 0) as total
      FROM salary_payments WHERE status = 'paid' AND date(payment_date) BETWEEN date(?) AND date(?)
    `).get(dateFrom, dateTo) as { total: number }

    const revenue = invoices.revenue
    const totalExpenses = expenses.total + purchases.total + salaries.total
    const netProfit = revenue - totalExpenses

    return {
      total_invoices: revenue,
      total_general_expenses: expenses.total,
      total_purchases: purchases.total,
      total_salaries: salaries.total,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      period: { from: dateFrom, to: dateTo }
    }
  })

  ipcMain.handle('reports:equipment', (_, equipmentId: number | null, dateFrom: string, dateTo: string) => {
    let equipmentQuery = 'SELECT * FROM equipment'
    const equipmentParams: unknown[] = []
    if (equipmentId) {
      equipmentQuery += ' WHERE id = ?'
      equipmentParams.push(equipmentId)
    }
    const equipmentList = db.prepare(equipmentQuery).all(...equipmentParams) as Array<{ id: number; name: string; code: string; type: string }>

    return equipmentList.map(eq => {
      const contracts = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
        FROM rental_contracts WHERE equipment_id = ? AND date(created_at) BETWEEN date(?) AND date(?)
      `).get(eq.id, dateFrom, dateTo) as { count: number; total: number }

      const invoices = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM invoices WHERE equipment_id = ? AND status IN ('paid','partial') AND date(created_at) BETWEEN date(?) AND date(?)
      `).get(eq.id, dateFrom, dateTo) as { total: number }

      const expenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses WHERE equipment_id = ? AND date(date) BETWEEN date(?) AND date(?)
      `).get(eq.id, dateFrom, dateTo) as { total: number }

      return {
        equipment_id: eq.id,
        equipment_name: eq.name,
        equipment_code: eq.code,
        contracts_count: contracts.count,
        total_contracts: contracts.total,
        total_invoices: invoices.total,
        total_expenses: expenses.total,
        net_profit: invoices.total - expenses.total
      }
    })
  })

  ipcMain.handle('reports:contracts', (_, dateFrom: string, dateTo: string) => {
    return db.prepare(`
      SELECT rc.*, c.name as client_name, e.name as equipment_name, e.code as equipment_code
      FROM rental_contracts rc
      LEFT JOIN clients c ON rc.client_id = c.id
      LEFT JOIN equipment e ON rc.equipment_id = e.id
      WHERE date(rc.created_at) BETWEEN date(?) AND date(?)
      ORDER BY rc.created_at DESC
    `).all(dateFrom, dateTo)
  })

  ipcMain.handle('reports:expenses', (_, dateFrom: string, dateTo: string) => {
    return db.prepare(`
      SELECT e.*, eq.name as equipment_name, eq.code as equipment_code
      FROM expenses e
      LEFT JOIN equipment eq ON e.equipment_id = eq.id
      WHERE date(e.date) BETWEEN date(?) AND date(?)
      ORDER BY e.date DESC
    `).all(dateFrom, dateTo)
  })
}
import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { recalculateClientBalance, recalculateInvoiceStatus } from '../db/accounting'
import { nextDocNumber } from '../db/helpers'
import type { DashboardStats, Expense, Payment, Invoice } from '@shared/types'

export function registerDashboardHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('dashboard:stats', (): DashboardStats => {
    const equipStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM equipment
    `).get() as { total: number; available: number; rented: number; maintenance: number }

    const clientCount = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as { c: number }).c
    const activeContracts = (db.prepare("SELECT COUNT(*) as c FROM rental_contracts WHERE status = 'active'").get() as { c: number }).c
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_before_vat), 0) as total FROM invoices WHERE status IN ('paid','partial')").get() as { total: number }).total
    const generalExpenses = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get() as { total: number }).total
    const paidPurchases = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM purchase_invoices WHERE status = 'paid'").get() as { total: number }).total
    const paidSalaries = (db.prepare("SELECT COALESCE(SUM(net_salary), 0) as total FROM salary_payments WHERE status = 'paid'").get() as { total: number }).total
    const totalExpenses = generalExpenses + paidPurchases + paidSalaries
    const pendingInvoices = (db.prepare("SELECT COUNT(*) as c FROM invoices WHERE status = 'pending'").get() as { c: number }).c

    return {
      total_equipment: equipStats?.total || 0,
      available_equipment: equipStats?.available || 0,
      rented_equipment: equipStats?.rented || 0,
      maintenance_equipment: equipStats?.maintenance || 0,
      total_clients: clientCount,
      active_contracts: activeContracts,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      pending_invoices: pendingInvoices
    }
  })

  ipcMain.handle('dashboard:equipmentPnL', (_, equipmentId: number): { revenue: number; expenses: number; profit: number } => {
    const revenue = (db.prepare(`
      SELECT COALESCE(SUM(i.amount), 0) as total 
      FROM invoices i 
      WHERE i.equipment_id = ? AND i.type = 'rental' AND i.status != 'cancelled'
    `).get(equipmentId) as { total: number }).total

    const expenses = (db.prepare(`
      SELECT COALESCE(SUM(e.amount), 0) as total 
      FROM expenses e 
      WHERE e.equipment_id = ?
    `).get(equipmentId) as { total: number }).total

    return { revenue, expenses, profit: revenue - expenses }
  })
}

export function registerExpenseHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('expenses:getAll', (): Expense[] => {
    return db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as Expense[]
  })

  ipcMain.handle('expenses:create', (_, expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): number => {
    const result = db.prepare(`
      INSERT INTO expenses (equipment_id, category, description, amount, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(expense.equipment_id, expense.category, expense.description, expense.amount, expense.date, expense.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('expenses:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('expenses:update', (_, id: number, expense: Partial<Expense>): boolean => {
    const allowed = ['equipment_id', 'category', 'description', 'amount', 'date', 'notes']
    const fields: string[] = []
    const values: unknown[] = []
    for (const [key, value] of Object.entries(expense)) {
      if (allowed.includes(key)) {
        fields.push(key + ' = ?')
        values.push(value)
      }
    }
    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare('UPDATE expenses SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)
    return true
  })
}

export function registerPaymentHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('payments:getAll', (): Payment[] => {
    return db.prepare('SELECT * FROM payments ORDER BY date DESC').all() as Payment[]
  })

  ipcMain.handle('payments:create', (_, payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): number => {
    if (!payment.client_id) throw new Error('العميل مطلوب')
    if (!payment.amount || payment.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(payment.client_id)
    if (!client) throw new Error('العميل غير موجود')
    if (payment.invoice_id) {
      const invoice = db.prepare('SELECT id, client_id FROM invoices WHERE id = ?').get(payment.invoice_id) as { id: number; client_id: number } | undefined
      if (!invoice) throw new Error('الفاتورة غير موجودة')
      if (invoice.client_id !== payment.client_id) throw new Error('العميل لا يطابق صاحب الفاتورة')
    }

    const paymentNumber = nextDocNumber(db, 'payments', 'PAY')

    const result = db.prepare(`
      INSERT INTO payments (payment_number, invoice_id, client_id, type, amount, method, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(paymentNumber, payment.invoice_id, payment.client_id, payment.type, payment.amount, payment.method, payment.date, payment.notes)

    // Keep client balance and invoice status in sync with source documents
    recalculateClientBalance(db, payment.client_id)
    if (payment.invoice_id) {
      recalculateInvoiceStatus(db, payment.invoice_id)
    }

    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('payments:delete', (_, id: number): boolean => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Payment | undefined
    if (!payment) return true

    db.prepare('DELETE FROM payments WHERE id = ?').run(id)
    recalculateClientBalance(db, payment.client_id)
    if (payment.invoice_id) {
      recalculateInvoiceStatus(db, payment.invoice_id)
    }
    return true
  })
}

export function registerInvoiceHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('invoices:getAll', (): Invoice[] => {
    return db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as Invoice[]
  })

  ipcMain.handle('invoices:create', (_, invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): number => {
    const invoiceNumber = nextDocNumber(db, 'invoices', 'INV')

    const result = db.prepare(`
      INSERT INTO invoices (invoice_number, contract_id, client_id, equipment_id, type, amount, tax_amount, vat_rate, total_before_vat, total_amount, status, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceNumber, invoice.contract_id, invoice.client_id, invoice.equipment_id, invoice.type, invoice.amount, invoice.tax_amount, (invoice as any).vat_rate ?? 15, (invoice as any).total_before_vat ?? invoice.amount, invoice.total_amount, invoice.status, invoice.due_date, invoice.notes)

    const invId = Number(result.lastInsertRowid)
    recalculateClientBalance(db, invoice.client_id)

    return invId
  })

  ipcMain.handle('invoices:update', (_, id: number, invoice: Partial<Invoice>): boolean => {
    const before = db.prepare('SELECT client_id FROM invoices WHERE id = ?').get(id) as { client_id: number } | undefined
    const allowed = ['contract_id', 'client_id', 'equipment_id', 'type', 'amount', 'tax_amount', 'vat_rate', 'total_before_vat', 'total_amount', 'status', 'due_date', 'notes']
    const fields: string[] = []
    const values: unknown[] = []
    for (const [key, value] of Object.entries(invoice)) {
      if (allowed.includes(key)) {
        fields.push(key + ' = ?')
        values.push(value)
      }
    }
    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare('UPDATE invoices SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)

    const after = db.prepare('SELECT client_id FROM invoices WHERE id = ?').get(id) as { client_id: number } | undefined
    if (before) recalculateClientBalance(db, before.client_id)
    if (after) recalculateClientBalance(db, after.client_id)
    return true
  })

  ipcMain.handle('invoices:delete', (_, id: number): boolean => {
    const invoice = db.prepare('SELECT client_id FROM invoices WHERE id = ?').get(id) as { client_id: number } | undefined
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id)
    if (invoice) recalculateClientBalance(db, invoice.client_id)
    return true
  })
}

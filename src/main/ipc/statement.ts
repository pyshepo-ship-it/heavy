import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'

export function registerStatementHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('statement:customer', (_, clientId: number, dateFrom: string, dateTo: string) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as Record<string, unknown> | undefined
    if (!client) throw new Error('العميل غير موجود')

    const openingBalance = client.opening_balance as number || 0

    const invoices = db.prepare(`
      SELECT id, invoice_number as ref, created_at as date, total_amount as amount, notes as description, 'invoice' as type
      FROM invoices WHERE client_id = ? AND status != 'cancelled' AND date(created_at) BETWEEN date(?) AND date(?)
    `).all(clientId, dateFrom, dateTo) as Array<{ ref: string; date: string; amount: number; description: string; type: string }>

    const payments = db.prepare(`
      SELECT id, payment_number as ref, date, amount, notes as description, 'payment' as type
      FROM payments WHERE client_id = ? AND date(date) BETWEEN date(?) AND date(?)
    `).all(clientId, dateFrom, dateTo) as Array<{ ref: string; date: string; amount: number; description: string; type: string }>

    const allTransactions = [...invoices, ...payments].sort((a, b) => a.date.localeCompare(b.date))

    let runningBalance = openingBalance
    const rows = allTransactions.map(tx => {
      if (tx.type === 'invoice') {
        runningBalance += tx.amount
        return { ...tx, debit: tx.amount, credit: 0, balance: runningBalance }
      } else {
        runningBalance -= tx.amount
        return { ...tx, debit: 0, credit: tx.amount, balance: runningBalance }
      }
    })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)

    return {
      client: { id: client.id, name: client.name, phone: client.phone, address: client.address },
      opening_balance: openingBalance,
      closing_balance: runningBalance,
      total_debit: totalInvoiced,
      total_credit: totalPaid,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      transactions: rows,
      period: { from: dateFrom, to: dateTo }
    }
  })

  ipcMain.handle('statement:equipmentSummary', () => {
    return db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM rental_contracts rc WHERE rc.equipment_id = e.id AND rc.status = 'active') as active_contracts,
        (SELECT COALESCE(SUM(rc.total_amount), 0) FROM rental_contracts rc WHERE rc.equipment_id = e.id) as total_contracts_value,
        (SELECT COALESCE(SUM(inv.total_amount), 0) FROM invoices inv WHERE inv.equipment_id = e.id AND inv.status IN ('paid','partial')) as total_invoiced
      FROM equipment e
      ORDER BY e.code
    `).all()
  })
}
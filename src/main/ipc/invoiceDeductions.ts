import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'

export function registerInvoiceDeductionHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('invoiceDeductions:getByInvoice', (_, invoiceId: number) => {
    return db.prepare('SELECT * FROM invoice_deductions WHERE invoice_id = ? ORDER BY id').all(invoiceId)
  })

  ipcMain.handle('invoiceDeductions:create', (_, deduction: { invoice_id: number; equipment_id: number | null; type: string; amount: number; description: string; date: string }) => {
    const result = db.prepare(`
      INSERT INTO invoice_deductions (invoice_id, equipment_id, type, amount, description, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(deduction.invoice_id, deduction.equipment_id, deduction.type, deduction.amount, deduction.description, deduction.date)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('invoiceDeductions:delete', (_, id: number) => {
    db.prepare('DELETE FROM invoice_deductions WHERE id = ?').run(id)
    return true
  })
}

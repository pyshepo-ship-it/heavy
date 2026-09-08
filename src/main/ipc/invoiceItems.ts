import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'

export function registerInvoiceItemHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('invoiceItems:getByInvoice', (_, invoiceId: number) => {
    return db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id').all(invoiceId)
  })

  ipcMain.handle('invoiceItems:create', (_, item: { invoice_id: number; equipment_id: number | null; description: string; qty: number; unit_price: number; amount: number; notes: string }) => {
    const result = db.prepare(`
      INSERT INTO invoice_items (invoice_id, equipment_id, description, qty, unit_price, amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.invoice_id, item.equipment_id, item.description, item.qty, item.unit_price, item.amount, item.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('invoiceItems:delete', (_, id: number) => {
    db.prepare('DELETE FROM invoice_items WHERE id = ?').run(id)
    return true
  })
}

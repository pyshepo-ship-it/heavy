import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { PurchaseInvoice } from '@shared/types'

export function registerPurchaseHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('purchases:getAll', (): PurchaseInvoice[] => {
    return db.prepare('SELECT * FROM purchase_invoices ORDER BY created_at DESC').all() as PurchaseInvoice[]
  })

  ipcMain.handle('purchases:create', (_, invoice: Omit<PurchaseInvoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>): number => {
    const count = (db.prepare('SELECT COUNT(*) as c FROM purchase_invoices').get() as { c: number }).c
    const invoiceNumber = `PUR-${String(count + 1).padStart(5, '0')}`

    const result = db.prepare(`
      INSERT INTO purchase_invoices (invoice_number, custody_id, vendor_name, description, amount, status, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceNumber, invoice.custody_id, invoice.vendor_name, invoice.description, invoice.amount, invoice.status, invoice.date, invoice.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('purchases:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM purchase_invoices WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('purchases:update', (_, id: number, invoice: Partial<PurchaseInvoice>): boolean => {
    const allowed = ['vendor_name', 'description', 'amount', 'status', 'notes']
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
    db.prepare('UPDATE purchase_invoices SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)
    return true
  })
}

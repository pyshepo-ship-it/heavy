import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { nextDocNumber } from '../db/helpers'
import type Database from 'better-sqlite3'
import type { PurchaseInvoice } from '@shared/types'

function recalculateCustodySpent(db: Database.Database, custodyId: number | null): void {
  if (!custodyId) return
  const spent = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM purchase_invoices
       WHERE custody_id = ? AND status != 'cancelled'`
    )
    .get(custodyId) as { total: number }
  db.prepare(
    `UPDATE custody
     SET spent = ?, remaining = amount - ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(spent.total, spent.total, custodyId)
}

export function registerPurchaseHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('purchases:getAll', (): PurchaseInvoice[] => {
    return db.prepare('SELECT * FROM purchase_invoices ORDER BY created_at DESC').all() as PurchaseInvoice[]
  })

  ipcMain.handle('purchases:create', (_, invoice: Omit<PurchaseInvoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>): number => {
    const invoiceNumber = nextDocNumber(db, 'purchase_invoices', 'PUR')
    const date = invoice.date || new Date().toISOString().slice(0, 10)

    const result = db.prepare(`
      INSERT INTO purchase_invoices (invoice_number, custody_id, vendor_name, description, amount, status, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceNumber, invoice.custody_id, invoice.vendor_name, invoice.description, invoice.amount, invoice.status, date, invoice.notes)
    recalculateCustodySpent(db, invoice.custody_id)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('purchases:delete', (_, id: number): boolean => {
    const before = db.prepare('SELECT custody_id FROM purchase_invoices WHERE id = ?').get(id) as { custody_id: number | null } | undefined
    db.prepare('DELETE FROM purchase_invoices WHERE id = ?').run(id)
    recalculateCustodySpent(db, before?.custody_id ?? null)
    return true
  })

  ipcMain.handle('purchases:update', (_, id: number, invoice: Partial<PurchaseInvoice>): boolean => {
    const before = db.prepare('SELECT custody_id FROM purchase_invoices WHERE id = ?').get(id) as { custody_id: number | null } | undefined
    const allowed = ['vendor_name', 'description', 'amount', 'status', 'date', 'notes']
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

    const after = db.prepare('SELECT custody_id FROM purchase_invoices WHERE id = ?').get(id) as { custody_id: number | null } | undefined
    recalculateCustodySpent(db, before?.custody_id ?? null)
    recalculateCustodySpent(db, after?.custody_id ?? null)
    return true
  })
}

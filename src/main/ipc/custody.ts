import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Custody, CustodyTransaction } from '@shared/types'

export function registerCustodyHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('custody:getAll', (): Custody[] => {
    return db.prepare('SELECT * FROM custody ORDER BY created_at DESC').all() as Custody[]
  })

  ipcMain.handle('custody:getById', (_, id: number): Custody | undefined => {
    return db.prepare('SELECT * FROM custody WHERE id = ?').get(id) as Custody | undefined
  })

  ipcMain.handle('custody:getTransactions', (_, custodyId: number): CustodyTransaction[] => {
    return db.prepare('SELECT * FROM custody_transactions WHERE custody_id = ? ORDER BY created_at DESC').all(custodyId) as CustodyTransaction[]
  })

  ipcMain.handle('custody:open', (_, data: {
    person_id: number
    person_type: 'employee' | 'driver'
    bank_id: number
    amount: number
    notes: string
  }): number => {
    const count = (db.prepare('SELECT COUNT(*) as c FROM custody').get() as { c: number }).c
    const custodyNumber = `CUST-${String(count + 1).padStart(5, '0')}`

    const result = db.prepare(`
      INSERT INTO custody (custody_number, person_id, person_type, bank_id, amount, spent, remaining, status, notes)
      VALUES (?, ?, ?, ?, ?, 0, ?, 'open', ?)
    `).run(custodyNumber, data.person_id, data.person_type, data.bank_id, data.amount, data.amount, data.notes)

    db.prepare("UPDATE banks SET balance = balance - ?, updated_at = datetime('now') WHERE id = ?").run(data.amount, data.bank_id)

    const custodyId = Number(result.lastInsertRowid)

    db.prepare(`
      INSERT INTO custody_transactions (custody_id, type, amount, description, date)
      VALUES (?, 'deposit', ?, 'فتح عهدة', date('now'))
    `).run(custodyId, data.amount)

    return custodyId
  })

  ipcMain.handle('custody:deposit', (_, custodyId: number, bankId: number, amount: number, description: string): boolean => {
    const custody = db.prepare('SELECT * FROM custody WHERE id = ?').get(custodyId) as Custody
    if (!custody || custody.status !== 'open') throw new Error('العهدة غير موجودة أو مغلقة')

    db.prepare(`
      INSERT INTO custody_transactions (custody_id, type, amount, description, date)
      VALUES (?, 'deposit', ?, ?, date('now'))
    `).run(custodyId, amount, description || 'تعزيز العهدة')

    db.prepare("UPDATE banks SET balance = balance - ?, updated_at = datetime('now') WHERE id = ?").run(amount, bankId)

    db.prepare("UPDATE custody SET amount = amount + ?, remaining = remaining + ?, updated_at = datetime('now') WHERE id = ?")
      .run(amount, amount, custodyId)

    return true
  })

  ipcMain.handle('custody:purchase', (_, custodyId: number, vendorName: string, description: string, amount: number, notes: string = ''): { invoice_id: number; custody_id: number } => {
    const custody = db.prepare('SELECT * FROM custody WHERE id = ?').get(custodyId) as Custody
    if (!custody || custody.status !== 'open') throw new Error('العهدة غير موجودة أو مغلقة')

    const invCount = (db.prepare('SELECT COUNT(*) as c FROM purchase_invoices').get() as { c: number }).c
    const invoiceNumber = `PUR-${String(invCount + 1).padStart(5, '0')}`

const invResult = db.prepare(`
      INSERT INTO purchase_invoices (invoice_number, custody_id, vendor_name, description, amount, status, date, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', date('now'), ?)
    `).run(invoiceNumber, custodyId, vendorName, description, amount, notes)

    const invoiceId = Number(invResult.lastInsertRowid)

    db.prepare(`
      INSERT INTO custody_transactions (custody_id, type, amount, description, purchase_invoice_id, date)
      VALUES (?, 'purchase', ?, ?, ?, date('now'))
    `).run(custodyId, amount, description, invoiceId)

    db.prepare("UPDATE custody SET spent = spent + ?, remaining = remaining - ?, updated_at = datetime('now') WHERE id = ?")
      .run(amount, amount, custodyId)

    return { invoice_id: invoiceId, custody_id: custodyId }
  })

  ipcMain.handle('custody:close', (_, custodyId: number, closingNotes: string): { difference: number; type: 'surplus' | 'deficit' | 'exact' } => {
    const custody = db.prepare('SELECT * FROM custody WHERE id = ?').get(custodyId) as Custody
    if (!custody || custody.status !== 'open') throw new Error('العهدة غير موجودة أو مغلقة')

    const difference = custody.amount - custody.spent
    let type: 'surplus' | 'deficit' | 'exact' = 'exact'

    if (difference > 0) {
      type = 'surplus'
      db.prepare(`
        INSERT INTO custody_transactions (custody_id, type, amount, description, date)
        VALUES (?, 'closing', ?, 'عهدة - مبلغ زائد يتم خصمه من الراتب', date('now'))
      `).run(custodyId, difference)
    } else if (difference < 0) {
      type = 'deficit'
      db.prepare(`
        INSERT INTO custody_transactions (custody_id, type, amount, description, date)
        VALUES (?, 'closing', ?, 'عهدة - مبلغ ناقص يتم صرفه مع الراتب', date('now'))
      `).run(custodyId, Math.abs(difference))
    }

    db.prepare(`
      UPDATE custody SET status = 'closed', closed_at = datetime('now'), remaining = 0, closing_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(closingNotes || '', custodyId)

    return { difference, type }
  })
}

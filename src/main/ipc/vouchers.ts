import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { nextDocNumber } from '../db/helpers'
import type Database from 'better-sqlite3'

interface Voucher {
  id: number
  voucher_number: string
  voucher_type: 'pay' | 'receive'
  client_id: number | null
  equipment_id: number | null
  invoice_id: number | null
  payment_id: number | null
  bank_id: number | null
  amount: number
  method: 'cash' | 'bank'
  date: string
  beneficiary: string
  description: string
  status: 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}

function applyBankImpact(db: Database.Database, voucher: Voucher, sign: 1 | -1): void {
  if (!voucher.bank_id || Math.abs(voucher.amount) <= 0) return
  const op = sign === 1 ? '+' : '-'
  db.prepare(`UPDATE banks SET balance = balance ${op} ?, updated_at = datetime('now') WHERE id = ?`).run(Math.abs(voucher.amount), voucher.bank_id)
}

export function registerVoucherHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('vouchers:getAll', (): Voucher[] => {
    return db.prepare(`SELECT v.*, c.name as client_name, e.name as equipment_name, e.code as equipment_code, b.name as bank_name
      FROM vouchers v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN equipment e ON v.equipment_id = e.id
      LEFT JOIN banks b ON v.bank_id = b.id
      ORDER BY v.created_at DESC`).all() as Voucher[]
  })

  ipcMain.handle('vouchers:getByType', (_, type: 'pay' | 'receive'): Voucher[] => {
    return db.prepare(`SELECT v.*, c.name as client_name, e.name as equipment_name, e.code as equipment_code, b.name as bank_name
      FROM vouchers v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN equipment e ON v.equipment_id = e.id
      LEFT JOIN banks b ON v.bank_id = b.id
      WHERE v.voucher_type = ?
      ORDER BY v.created_at DESC`).all(type) as Voucher[]
  })

  ipcMain.handle('vouchers:create', (_, data: Omit<Voucher, 'id' | 'voucher_number' | 'created_at' | 'updated_at'>): number => {
    const amount = Number(data.amount) || 0
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')
    if (!data.date) throw new Error('التاريخ مطلوب')

    const prefix = data.voucher_type === 'pay' ? 'PAYOUT' : 'RECV'
    const voucherNumber = nextDocNumber(db, 'vouchers', prefix, 6)

    const client = data.client_id ? db.prepare('SELECT id FROM clients WHERE id = ?').get(data.client_id) : undefined
    if (data.client_id && !client) throw new Error('العميل غير موجود')
    const equipment = data.equipment_id ? db.prepare('SELECT id FROM equipment WHERE id = ?').get(data.equipment_id) : undefined
    if (data.equipment_id && !equipment) throw new Error('المعدة غير موجودة')

    const existing = data.invoice_id ? db.prepare('SELECT id FROM invoices WHERE id = ?').get(data.invoice_id) : undefined
    if (data.invoice_id && !existing) throw new Error('الفاتورة غير موجودة')

    const result = db.prepare(`
      INSERT INTO vouchers (voucher_number, voucher_type, client_id, equipment_id, invoice_id, payment_id, bank_id, amount, method, date, beneficiary, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(
      voucherNumber,
      data.voucher_type,
      data.client_id ?? null,
      data.equipment_id ?? null,
      data.invoice_id ?? null,
      data.payment_id ?? null,
      data.bank_id ?? null,
      amount,
      data.method || 'cash',
      data.date,
      data.beneficiary || '',
      data.description || ''
    )

    const voucherId = Number(result.lastInsertRowid)

    if (data.status !== 'cancelled') {
      // سند قبض: يزيد رصيد الخزينة، وسند صرف: ينقص رصيد الخزينة
      applyBankImpact(db, { ...data, id: voucherId, status: 'confirmed' } as Voucher, data.voucher_type === 'receive' ? 1 : -1)
    }

    return voucherId
  })

  ipcMain.handle('vouchers:update', (_, id: number, data: Partial<Voucher>): boolean => {
    const before = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id) as Voucher | undefined
    if (!before) throw new Error('السند غير موجود')

    const allowed = ['client_id', 'equipment_id', 'invoice_id', 'payment_id', 'bank_id', 'amount', 'method', 'date', 'beneficiary', 'description', 'status']
    const fields: string[] = []
    const values: unknown[] = []
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key) && key !== 'id') {
        fields.push(key + ' = ?')
        values.push(value)
      }
    }
    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare('UPDATE vouchers SET ' + fields.join(', ') + ' WHERE id = ?').run(...values)

    const after = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id) as Voucher | undefined
    if (after?.status === 'confirmed' && after.amount !== before.amount) {
      applyBankImpact(db, after, after.voucher_type === 'receive' ? 1 : -1)
    }
    return true
  })

  ipcMain.handle('vouchers:delete', (_, id: number): boolean => {
    const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id) as Voucher | undefined
    if (!voucher) return true
    db.prepare('DELETE FROM vouchers WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('vouchers:report', (_, type: 'pay' | 'receive', dateFrom: string, dateTo: string) => {
    return db.prepare(`SELECT v.*, c.name as client_name, e.name as equipment_name, e.code as equipment_code, b.name as bank_name
      FROM vouchers v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN equipment e ON v.equipment_id = e.id
      LEFT JOIN banks b ON v.bank_id = b.id
      WHERE v.voucher_type = ? AND v.status != 'cancelled'
        AND date(v.date) BETWEEN date(?) AND date(?)
      ORDER BY v.date DESC`).all(type, dateFrom, dateTo)
  })

  ipcMain.handle('vouchers:equipmentSummary', (_, equipmentId: number, dateFrom: string, dateTo: string) => {
    const pay = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM vouchers WHERE equipment_id = ? AND voucher_type = 'pay' AND status != 'cancelled'
        AND date(date) BETWEEN date(?) AND date(?)
    `).get(equipmentId, dateFrom, dateTo) as { total: number }
    const receive = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM vouchers WHERE equipment_id = ? AND voucher_type = 'receive' AND status != 'cancelled'
        AND date(date) BETWEEN date(?) AND date(?)
    `).get(equipmentId, dateFrom, dateTo) as { total: number }
    return { total_paid: pay.total, total_received: receive.total, net: receive.total - pay.total }
  })
}

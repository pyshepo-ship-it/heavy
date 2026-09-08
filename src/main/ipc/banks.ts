import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Bank } from '@shared/types'

export function registerBankHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('banks:getAll', (): Bank[] => {
    return db.prepare('SELECT * FROM banks ORDER BY created_at DESC').all() as Bank[]
  })

  ipcMain.handle('banks:getById', (_, id: number): Bank | undefined => {
    return db.prepare('SELECT * FROM banks WHERE id = ?').get(id) as Bank | undefined
  })

  ipcMain.handle('banks:create', (_, bank: Omit<Bank, 'id' | 'created_at' | 'updated_at'>): number => {
    const result = db.prepare(`
      INSERT INTO banks (name, type, account_number, balance, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(bank.name, bank.type, bank.account_number, bank.balance, bank.notes)
    return Number(result.lastInsertRowid)
  })

  const allowedColumns = new Set(['name', 'type', 'account_number', 'balance', 'notes'])

  ipcMain.handle('banks:update', (_, id: number, bank: Partial<Bank>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []
    Object.entries(bank).forEach(([key, value]) => {
      if (allowedColumns.has(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })
    if (fields.length === 0) return true
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE banks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('banks:updateBalance', (_, id: number, amount: number, operation: 'add' | 'subtract'): boolean => {
    const op = operation === 'add' ? '+' : '-'
    db.prepare(`UPDATE banks SET balance = balance ${op} ?, updated_at = datetime('now') WHERE id = ?`).run(Number(amount) || 0, id)
    return true
  })

  ipcMain.handle('banks:delete', (_, id: number): boolean => {
    const refs = db.prepare('SELECT COUNT(*) as c FROM custody WHERE bank_id = ?').get(id) as { c: number }
    if (refs.c > 0) throw new Error('لا يمكن حذف البنك/الخزينة لوجود عهد مرتبطة به')
    db.prepare('DELETE FROM banks WHERE id = ?').run(id)
    return true
  })
}

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

  ipcMain.handle('banks:update', (_, id: number, bank: Partial<Bank>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []
    Object.entries(bank).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE banks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('banks:updateBalance', (_, id: number, amount: number, operation: 'add' | 'subtract'): boolean => {
    const op = operation === 'add' ? '+' : '-'
    db.prepare(`UPDATE banks SET balance = balance ${op} ?, updated_at = datetime('now') WHERE id = ?`).run(Math.abs(amount), id)
    return true
  })

  ipcMain.handle('banks:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM banks WHERE id = ?').run(id)
    return true
  })
}

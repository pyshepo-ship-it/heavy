import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { Client } from '@shared/types'

export function registerClientHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('clients:getAll', (): Client[] => {
    return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as Client[]
  })

  ipcMain.handle('clients:getById', (_, id: number): Client | undefined => {
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined
  })

  ipcMain.handle('clients:create', (_, client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): number => {
    const result = db.prepare(`
      INSERT INTO clients (name, phone, company, address, credit_limit, opening_balance, current_balance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(client.name, client.phone, client.company, client.address, client.credit_limit, client.opening_balance, client.opening_balance, client.notes)
    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('clients:update', (_, id: number, client: Partial<Client>): boolean => {
    const fields: string[] = []
    const values: unknown[] = []

    Object.entries(client).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    fields.push("updated_at = datetime('now')")
    values.push(id)

    db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('clients:delete', (_, id: number): boolean => {
    db.prepare('DELETE FROM clients WHERE id = ?').run(id)
    return true
  })
}

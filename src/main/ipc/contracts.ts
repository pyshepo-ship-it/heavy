import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import type { RentalContract, Invoice, Equipment, Client } from '@shared/types'

export function registerContractHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('contracts:getAll', (): RentalContract[] => {
    return db.prepare('SELECT * FROM rental_contracts ORDER BY created_at DESC').all() as RentalContract[]
  })

  ipcMain.handle('contracts:getById', (_, id: number): RentalContract | undefined => {
    return db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id) as RentalContract | undefined
  })

  ipcMain.handle('contracts:create', (_, contract: {
    client_id: number
    equipment_id: number
    driver_id: number | null
    start_date: string
    unit_price: number
    notes: string
  }): number => {
    const count = db.prepare('SELECT COUNT(*) as c FROM rental_contracts').get() as { c: number }
    const contractNumber = `RC-${String(count.c + 1).padStart(5, '0')}`

    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(contract.equipment_id) as Equipment
    if (!equipment) throw new Error('Equipment not found')

    db.prepare('UPDATE equipment SET status = ? WHERE id = ?').run('rented', contract.equipment_id)

    const result = db.prepare(`
      INSERT INTO rental_contracts (contract_number, client_id, equipment_id, driver_id, start_date, meter_start, unit_price, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(contractNumber, contract.client_id, contract.equipment_id, contract.driver_id, contract.start_date, equipment.current_meter, contract.unit_price, contract.notes)

    return Number(result.lastInsertRowid)
  })

  ipcMain.handle('contracts:close', (_, id: number, meterEnd: number): { invoice_id: number } => {
    const contract = db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id) as RentalContract
    if (!contract) throw new Error('Contract not found')

    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(contract.equipment_id) as Equipment
    const unitDelta = Math.max(0, meterEnd - contract.meter_start)
    const totalAmount = unitDelta * contract.unit_price

    // Close contract
    db.prepare(`
      UPDATE rental_contracts 
      SET meter_end = ?, total_amount = ?, status = 'closed', end_date = date('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(meterEnd, totalAmount, id)

    // Update equipment meter & status
    db.prepare("UPDATE equipment SET current_meter = ?, status = 'available', updated_at = datetime('now') WHERE id = ?").run(meterEnd, contract.equipment_id)

    // Update client balance
    db.prepare("UPDATE clients SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = ?").run(totalAmount, contract.client_id)

    // Generate invoice
    const invCount = db.prepare('SELECT COUNT(*) as c FROM invoices').get() as { c: number }
    const invoiceNumber = `INV-${String(invCount.c + 1).padStart(5, '0')}`

    const invResult = db.prepare(`
      INSERT INTO invoices (invoice_number, contract_id, client_id, equipment_id, type, amount, total_amount, status, due_date, notes)
      VALUES (?, ?, ?, ?, 'rental', ?, ?, 'pending', date('now', '+30 days'), 'Auto-generated from contract closure')
    `).run(invoiceNumber, id, contract.client_id, contract.equipment_id, totalAmount, totalAmount)

    const invId = Number(invResult.lastInsertRowid)
    db.prepare(`
      INSERT INTO invoice_items (invoice_id, equipment_id, description, qty, unit_price, amount, notes)
      VALUES (?, ?, ?, 1, ?, ?, 'إيجار - إغلاق عقد')
    `).run(invId, contract.equipment_id, contract.contract_number, contract.unit_price, totalAmount)

    return { invoice_id: Number(invResult.lastInsertRowid) }
  })

  ipcMain.handle('contracts:cancel', (_, id: number): boolean => {
    const contract = db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id) as RentalContract
    if (!contract) throw new Error('Contract not found')

    db.prepare("UPDATE equipment SET status = 'available', updated_at = datetime('now') WHERE id = ?").run(contract.equipment_id)
    db.prepare("UPDATE rental_contracts SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id)
    return true
  })
}

import { ipcMain } from 'electron'
import { getDatabase } from '../db/schema'
import { recalculateClientBalance } from '../db/accounting'
import { nextDocNumber } from '../db/helpers'
import type { RentalContract, Invoice, Equipment } from '@shared/types'

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
    const contractNumber = nextDocNumber(db, 'rental_contracts', 'RC')

    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(contract.client_id)
    if (!client) throw new Error('العميل غير موجود')

    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(contract.equipment_id) as Equipment
    if (!equipment) throw new Error('المعدة غير موجودة')
    if (equipment.status !== 'available') throw new Error('المعدة غير متاحة للتأجير')

    const activeContract = db.prepare(
      "SELECT id FROM rental_contracts WHERE equipment_id = ? AND status = 'active' LIMIT 1"
    ).get(contract.equipment_id)
    if (activeContract) throw new Error('توجد عهدة/عقد نشط لهذه المعدة')

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
    if (contract.status !== 'active') throw new Error('لا يمكن إغلاق عقد غير نشط')

    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(contract.equipment_id) as Equipment
    if (meterEnd < contract.meter_start) throw new Error('العداد النهائي يجب ألا يكون أقل من عداد البداية')

    const unitDelta = Math.max(0, meterEnd - contract.meter_start)
    const beforeVat = unitDelta * contract.unit_price
    const vatSetting = db.prepare('SELECT vat_rate FROM app_settings LIMIT 1').get() as { vat_rate: number } | undefined
    const vatRate = Number(vatSetting?.vat_rate ?? 15)
    const taxAmount = beforeVat * vatRate / 100
    const totalAmount = beforeVat + taxAmount

    // Close contract
    db.prepare(`
      UPDATE rental_contracts 
      SET meter_end = ?, total_amount = ?, status = 'closed', end_date = date('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(meterEnd, beforeVat, id)

    // Update equipment meter & status
    db.prepare("UPDATE equipment SET current_meter = ?, status = 'available', updated_at = datetime('now') WHERE id = ?").run(meterEnd, contract.equipment_id)

    // Generate invoice
    const invoiceNumber = nextDocNumber(db, 'invoices', 'INV')

    const invResult = db.prepare(`
      INSERT INTO invoices (invoice_number, contract_id, client_id, equipment_id, type, amount, tax_amount, vat_rate, total_before_vat, total_amount, status, due_date, notes)
      VALUES (?, ?, ?, ?, 'rental', ?, ?, ?, ?, ?, 'pending', date('now', '+30 days'), 'Auto-generated from contract closure')
    `).run(invoiceNumber, id, contract.client_id, contract.equipment_id, beforeVat, taxAmount, vatRate, beforeVat, totalAmount)

    const invId = Number(invResult.lastInsertRowid)
    db.prepare(`
      INSERT INTO invoice_items (invoice_id, equipment_id, description, qty, unit_price, amount, notes)
      VALUES (?, ?, ?, 1, ?, ?, 'إيجار - إغلاق عقد')
    `).run(invId, contract.equipment_id, contract.contract_number, contract.unit_price, beforeVat)

    recalculateClientBalance(db, contract.client_id)

    return { invoice_id: Number(invResult.lastInsertRowid) }
  })

  ipcMain.handle('contracts:cancel', (_, id: number): boolean => {
    const contract = db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id) as RentalContract
    if (!contract) throw new Error('Contract not found')
    if (contract.status !== 'active') throw new Error('لا يمكن إلغاء عقد غير نشط')

    db.prepare("UPDATE equipment SET status = 'available', updated_at = datetime('now') WHERE id = ?").run(contract.equipment_id)
    db.prepare("UPDATE rental_contracts SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id)
    return true
  })
}

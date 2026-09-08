import type Database from 'better-sqlite3'

/**
 * Recalculates a client's current_balance from source documents.
 * This keeps the cached balance consistent with invoices and payments,
 * even when invoices or payments are edited/deleted.
 */
export function recalculateClientBalance(db: Database.Database, clientId: number): void {
  const client = db.prepare('SELECT opening_balance FROM clients WHERE id = ?').get(clientId) as
    | { opening_balance: number }
    | undefined
  if (!client) return

  const invoices = db
    .prepare(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM invoices
       WHERE client_id = ? AND status != 'cancelled'`
    )
    .get(clientId) as { total: number }

  const receipts = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE client_id = ? AND type = 'receipt'`
    )
    .get(clientId) as { total: number }

  const refunds = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE client_id = ? AND type = 'payment'`
    )
    .get(clientId) as { total: number }

  const balance =
    (client.opening_balance || 0) +
    (invoices.total || 0) -
    (receipts.total || 0) +
    (refunds.total || 0)

  db.prepare(
    "UPDATE clients SET current_balance = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(balance, clientId)
}

/**
 * Recomputes the invoice status from its payment history.
 * Cancelled invoices are never changed by payment routines.
 */
export function recalculateInvoiceStatus(db: Database.Database, invoiceId: number): void {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as
    | { id: number; total_amount: number; status: string }
    | undefined
  if (!invoice || invoice.status === 'cancelled') return

  const total = Number(invoice.total_amount || 0)
  const paid = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE invoice_id = ? AND type = 'receipt'`
    )
    .get(invoiceId) as { total: number }

  const refunded = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE invoice_id = ? AND type = 'payment'`
    )
    .get(invoiceId) as { total: number }

  const netPaid = (paid.total || 0) - (refunded.total || 0)
  let status = 'pending'
  if (netPaid >= total && total > 0) status = 'paid'
  else if (netPaid > 0) status = 'partial'

  db.prepare("UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    invoiceId
  )
}

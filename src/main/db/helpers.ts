import type Database from 'better-sqlite3'

/**
 * Generates the next document number for a table using MAX(id)+1.
 * Using MAX(id) (instead of COUNT(*)) prevents duplicate document numbers
 * after rows have been deleted.
 */
export function nextDocNumber(
  db: Database.Database,
  table: string,
  prefix: string,
  width = 5
): string {
  const row = db.prepare(`SELECT MAX(id) as maxId FROM ${table}`).get() as {
    maxId: number | null
  }
  const n = Number(row?.maxId ?? 0) + 1
  return `${prefix}-${String(n).padStart(width, '0')}`
}

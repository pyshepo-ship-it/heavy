import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'erp.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initializeSchema(db)
  return db
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      address TEXT DEFAULT '',
      credit_limit REAL DEFAULT 0,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      current_meter REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      daily_rate REAL DEFAULT 0,
      monthly_rate REAL DEFAULT 0,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','rented','maintenance')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT '',
      salary REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      employee_id INTEGER,
      daily_wage REAL DEFAULT 0,
      overtime_rate REAL DEFAULT 0,
      equipment_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'bank' CHECK(type IN ('bank','cashbox')),
      account_number TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS custody (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custody_number TEXT NOT NULL UNIQUE,
      person_id INTEGER NOT NULL,
      person_type TEXT NOT NULL CHECK(person_type IN ('employee','driver')),
      bank_id INTEGER NOT NULL,
      amount REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
      notes TEXT DEFAULT '',
      closed_at TEXT,
      closing_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (bank_id) REFERENCES banks(id)
    );

    CREATE TABLE IF NOT EXISTS custody_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custody_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit','purchase','reimbursement','closing')),
      amount REAL DEFAULT 0,
      description TEXT DEFAULT '',
      purchase_invoice_id INTEGER,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (custody_id) REFERENCES custody(id) ON DELETE CASCADE,
      FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      custody_id INTEGER,
      vendor_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
      date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (custody_id) REFERENCES custody(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS rental_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_number TEXT NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      driver_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT,
      meter_start REAL DEFAULT 0,
      meter_end REAL,
      unit_price REAL DEFAULT 0,
      contract_type TEXT DEFAULT 'monthly' CHECK(contract_type IN ('daily','monthly')),
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','cancelled')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      contract_id INTEGER,
      client_id INTEGER NOT NULL,
      equipment_id INTEGER,
      type TEXT DEFAULT 'rental' CHECK(type IN ('rental','direct','expense')),
      amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      vat_rate REAL DEFAULT 15,
      total_before_vat REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','partial','cancelled')),
      due_date TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contract_id) REFERENCES rental_contracts(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT NOT NULL UNIQUE,
      invoice_id INTEGER,
      client_id INTEGER NOT NULL,
      type TEXT DEFAULT 'receipt' CHECK(type IN ('receipt','payment')),
      amount REAL DEFAULT 0,
      method TEXT DEFAULT 'cash' CHECK(method IN ('cash','bank')),
      date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS license_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      activation_code TEXT DEFAULT '',
      activated_at TEXT DEFAULT (datetime('now')),
      expiry_date TEXT NOT NULL,
      is_trial INTEGER DEFAULT 1,
      days_remaining INTEGER DEFAULT 7,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      base_salary REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_rate REAL DEFAULT 0,
      overtime_amount REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      advances_total REAL DEFAULT 0,
      deductions_total REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
      payment_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS salary_advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      amount REAL DEFAULT 0,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      is_deducted INTEGER DEFAULT 0,
      payroll_item_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS salary_deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      is_applied INTEGER DEFAULT 0,
      payroll_item_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payroll_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_number TEXT NOT NULL UNIQUE,
      month TEXT NOT NULL,
      total_employees INTEGER DEFAULT 0,
      total_gross REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      total_net REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','processed','paid')),
      processed_at TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payroll_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_run_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      base_salary REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_amount REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      advances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_pay REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT DEFAULT '',
      company_name_en TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      website TEXT DEFAULT '',
      tax_number TEXT DEFAULT '',
      commercial_reg TEXT DEFAULT '',
      unified_number TEXT DEFAULT '',
      country TEXT DEFAULT 'SA',
      currency TEXT DEFAULT 'ر.س',
      vat_rate REAL DEFAULT 15,
      vat_note TEXT DEFAULT 'شامل ضريبة القيمة المضافة 15%',
      print_settings TEXT DEFAULT '{}',
      logo_path TEXT DEFAULT '',
      footer_text TEXT DEFAULT '',
      font_size INTEGER DEFAULT 12,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      equipment_id INTEGER,
      description TEXT NOT NULL,
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      equipment_id INTEGER,
      type TEXT DEFAULT 'breakdown' CHECK(type IN ('breakdown','delay','damage','other')),
      amount REAL DEFAULT 0,
      description TEXT DEFAULT '',
      date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    );
    `)

  // Migrations: add missing columns to existing tables
  const migrations = [
    { table: 'custody', column: 'notes', definition: "TEXT DEFAULT ''" },
    { table: 'app_settings', column: 'footer_text', definition: "TEXT DEFAULT ''" },
    { table: 'app_settings', column: 'font_size', definition: "INTEGER DEFAULT 12" },
    { table: 'invoices', column: 'vat_rate', definition: 'REAL DEFAULT 15' },
    { table: 'invoices', column: 'total_before_vat', definition: 'REAL DEFAULT 0' },
    { table: 'rental_contracts', column: 'contract_type', definition: "TEXT DEFAULT 'monthly'" },
  ]
  for (const m of migrations) {
    try {
      db.prepare(`SELECT ${m.column} FROM ${m.table} LIMIT 1`).get()
    } catch {
      db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`)
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

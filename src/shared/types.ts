export interface Client {
  id: number
  name: string
  phone: string
  company: string
  address: string
  credit_limit: number
  opening_balance: number
  current_balance: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: number
  code: string
  name: string
  type: string
  current_meter: number
  hourly_rate: number
  daily_rate: number
  monthly_rate: number
  status: 'available' | 'rented' | 'maintenance'
  notes: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  phone: string
  role: string
  salary: number
  status: 'active' | 'inactive'
  notes: string
  created_at: string
  updated_at: string
}

export interface Driver {
  id: number
  name: string
  phone: string
  employee_id: number | null
  daily_wage: number
  overtime_rate: number
  equipment_id: number | null
  notes: string
  created_at: string
  updated_at: string
}

export interface Bank {
  id: number
  name: string
  type: 'bank' | 'cashbox'
  account_number: string
  balance: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Custody {
  id: number
  custody_number: string
  person_id: number
  person_type: 'employee' | 'driver'
  bank_id: number
  amount: number
  spent: number
  remaining: number
  status: 'open' | 'closed'
  closed_at: string | null
  closing_notes: string
  created_at: string
  updated_at: string
}

export interface CustodyTransaction {
  id: number
  custody_id: number
  type: 'deposit' | 'purchase' | 'reimbursement' | 'closing'
  amount: number
  description: string
  purchase_invoice_id: number | null
  date: string
  created_at: string
}

export interface PurchaseInvoice {
  id: number
  invoice_number: string
  custody_id: number | null
  vendor_name: string
  description: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface RentalContract {
  id: number
  contract_number: string
  client_id: number
  equipment_id: number
  driver_id: number | null
  start_date: string
  end_date: string | null
  meter_start: number
  meter_end: number | null
  unit_price: number
  total_amount: number
  contract_type: 'daily' | 'monthly'
  status: 'active' | 'closed' | 'cancelled'
  notes: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  contract_id: number | null
  client_id: number
  equipment_id: number | null
  type: 'rental' | 'direct' | 'expense'
  amount: number
  tax_amount: number
  vat_rate: number
  total_before_vat: number
  total_amount: number
  status: 'pending' | 'paid' | 'partial' | 'cancelled'
  due_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  equipment_id: number | null
  category: string
  description: string
  amount: number
  date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  payment_number: string
  invoice_id: number | null
  client_id: number
  type: 'receipt' | 'payment'
  amount: number
  method: 'cash' | 'bank'
  date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface LicenseInfo {
  id: number
  device_id: string
  activation_code: string
  activated_at: string
  expiry_date: string
  is_trial: boolean
  days_remaining: number
  created_at: string
}

export interface AboutData {
  announcement: string
  version: string
  support_link: string
  status_message: string
  updated_at?: string
}

export interface DashboardStats {
  total_equipment: number
  available_equipment: number
  rented_equipment: number
  maintenance_equipment: number
  total_clients: number
  active_contracts: number
  total_revenue: number
  total_expenses: number
  net_profit: number
  pending_invoices: number
}

export interface SalaryPayment {
  id: number
  payment_number: string
  employee_id: number
  month: string
  base_salary: number
  overtime_hours: number
  overtime_rate: number
  overtime_amount: number
  bonus: number
  advances_total: number
  deductions_total: number
  net_salary: number
  status: 'pending' | 'paid' | 'cancelled'
  payment_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface SalaryAdvance {
  id: number
  employee_id: number
  amount: number
  description: string
  date: string
  is_deducted: boolean
  payroll_item_id: number | null
  notes: string
  created_at: string
  updated_at: string
}

export interface SalaryDeduction {
  id: number
  employee_id: number
  type: string
  amount: number
  description: string
  date: string
  is_applied: boolean
  payroll_item_id: number | null
  notes: string
  created_at: string
  updated_at: string
}

export interface PayrollRun {
  id: number
  run_number: string
  month: string
  total_employees: number
  total_gross: number
  total_deductions: number
  total_net: number
  status: 'draft' | 'processed' | 'paid'
  processed_at: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface PayrollItem {
  id: number
  payroll_run_id: number
  employee_id: number
  employee_name?: string
  base_salary: number
  overtime_hours: number
  overtime_amount: number
  bonus: number
  advances: number
  deductions: number
  net_pay: number
  status: 'pending' | 'paid'
  notes: string
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id: number
  company_name: string
  company_name_en: string
  phone: string
  email: string
  address: string
  website: string
  tax_number: string
  commercial_reg: string
  unified_number: string
  country: string
  currency: string
  vat_rate: number
  vat_note: string
  print_settings: string
  logo_path: string
  footer_text: string
  font_size: number
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  equipment_id: number | null
  description: string
  qty: number
  unit_price: number
  amount: number
  notes: string
  created_at: string
}

export interface InvoiceDeduction {
  id: number
  invoice_id: number
  equipment_id: number | null
  type: 'breakdown' | 'delay' | 'damage' | 'other'
  amount: number
  description: string
  date: string
  created_at: string
}

export interface Voucher {
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

export interface PrintSettings {
  template?: 'modern' | 'classic' | 'compact' | 'elegant' | 'thermal'
  paper?: 'A4' | 'A5' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  accent_color?: string
  show_logo?: boolean
  show_company_name?: boolean
  show_tax_number?: boolean
  show_commercial_reg?: boolean
  show_address?: boolean
  show_phone?: boolean
  show_footer?: boolean
  footer_text?: string
  font_size?: number
}

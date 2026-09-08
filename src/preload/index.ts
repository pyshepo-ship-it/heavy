import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Clients
  getClients: () => ipcRenderer.invoke('clients:getAll'),
  getClientById: (id: number) => ipcRenderer.invoke('clients:getById', id),
  createClient: (client: any) => ipcRenderer.invoke('clients:create', client),
  updateClient: (id: number, client: any) => ipcRenderer.invoke('clients:update', id, client),
  deleteClient: (id: number) => ipcRenderer.invoke('clients:delete', id),

  // Equipment
  getEquipment: () => ipcRenderer.invoke('equipment:getAll'),
  getEquipmentById: (id: number) => ipcRenderer.invoke('equipment:getById', id),
  createEquipment: (equipment: any) => ipcRenderer.invoke('equipment:create', equipment),
  updateEquipment: (id: number, equipment: any) => ipcRenderer.invoke('equipment:update', id, equipment),
  deleteEquipment: (id: number) => ipcRenderer.invoke('equipment:delete', id),
  updateEquipmentMeter: (id: number, meter: number) => ipcRenderer.invoke('equipment:updateMeter', id, meter),

  // Contracts
  getContracts: () => ipcRenderer.invoke('contracts:getAll'),
  getContractById: (id: number) => ipcRenderer.invoke('contracts:getById', id),
  createContract: (contract: any) => ipcRenderer.invoke('contracts:create', contract),
  closeContract: (id: number, meterEnd: number) => ipcRenderer.invoke('contracts:close', id, meterEnd),
  cancelContract: (id: number) => ipcRenderer.invoke('contracts:cancel', id),

  // Invoices
  getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
  createInvoice: (invoice: any) => ipcRenderer.invoke('invoices:create', invoice),
  updateInvoice: (id: number, invoice: any) => ipcRenderer.invoke('invoices:update', id, invoice),
  deleteInvoice: (id: number) => ipcRenderer.invoke('invoices:delete', id),

  // Expenses
  getExpenses: () => ipcRenderer.invoke('expenses:getAll'),
  createExpense: (expense: any) => ipcRenderer.invoke('expenses:create', expense),
  updateExpense: (id: number, expense: any) => ipcRenderer.invoke('expenses:update', id, expense),
  deleteExpense: (id: number) => ipcRenderer.invoke('expenses:delete', id),

  // Payments
  getPayments: () => ipcRenderer.invoke('payments:getAll'),
  createPayment: (payment: any) => ipcRenderer.invoke('payments:create', payment),
  deletePayment: (id: number) => ipcRenderer.invoke('payments:delete', id),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:stats'),
  getEquipmentPnL: (equipmentId: number) => ipcRenderer.invoke('dashboard:equipmentPnL', equipmentId),

  // License
  checkLicense: () => ipcRenderer.invoke('license:check'),
  activateLicense: (code: string) => ipcRenderer.invoke('license:activate', code),
  getDeviceId: () => ipcRenderer.invoke('license:getDeviceId'),

  // Drivers
  getDrivers: () => ipcRenderer.invoke('drivers:getAll'),
  getDriverById: (id: number) => ipcRenderer.invoke('drivers:getById', id),
  createDriver: (driver: any) => ipcRenderer.invoke('drivers:create', driver),
  updateDriver: (id: number, driver: any) => ipcRenderer.invoke('drivers:update', id, driver),
  deleteDriver: (id: number) => ipcRenderer.invoke('drivers:delete', id),

  // Employees
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  getEmployeeById: (id: number) => ipcRenderer.invoke('employees:getById', id),
  createEmployee: (employee: any) => ipcRenderer.invoke('employees:create', employee),
  updateEmployee: (id: number, employee: any) => ipcRenderer.invoke('employees:update', id, employee),
  deleteEmployee: (id: number) => ipcRenderer.invoke('employees:delete', id),

  // Banks
  getBanks: () => ipcRenderer.invoke('banks:getAll'),
  getBankById: (id: number) => ipcRenderer.invoke('banks:getById', id),
  createBank: (bank: any) => ipcRenderer.invoke('banks:create', bank),
  updateBank: (id: number, bank: any) => ipcRenderer.invoke('banks:update', id, bank),
  updateBankBalance: (id: number, amount: number, operation: 'add' | 'subtract') => ipcRenderer.invoke('banks:updateBalance', id, amount, operation),
  deleteBank: (id: number) => ipcRenderer.invoke('banks:delete', id),

  // Custody
  getCustody: () => ipcRenderer.invoke('custody:getAll'),
  getCustodyById: (id: number) => ipcRenderer.invoke('custody:getById', id),
  getCustodyTransactions: (custodyId: number) => ipcRenderer.invoke('custody:getTransactions', custodyId),
  openCustody: (data: any) => ipcRenderer.invoke('custody:open', data),
  depositCustody: (custodyId: number, bankId: number, amount: number, description: string) => ipcRenderer.invoke('custody:deposit', custodyId, bankId, amount, description),
  purchaseCustody: (custodyId: number, vendorName: string, description: string, amount: number) => ipcRenderer.invoke('custody:purchase', custodyId, vendorName, description, amount),
  closeCustody: (custodyId: number, closingNotes: string) => ipcRenderer.invoke('custody:close', custodyId, closingNotes),

  // Purchase Invoices
  getPurchaseInvoices: () => ipcRenderer.invoke('purchases:getAll'),
  createPurchaseInvoice: (invoice: any) => ipcRenderer.invoke('purchases:create', invoice),
  updatePurchaseInvoice: (id: number, invoice: any) => ipcRenderer.invoke('purchases:update', id, invoice),
  deletePurchaseInvoice: (id: number) => ipcRenderer.invoke('purchases:delete', id),

  // Salary Payments
  getSalaryPayments: () => ipcRenderer.invoke('salaryPayments:getAll'),
  getSalaryPaymentsByMonth: (month: string) => ipcRenderer.invoke('salaryPayments:getByMonth', month),
  createSalaryPayment: (payment: any) => ipcRenderer.invoke('salaryPayments:create', payment),
  markSalaryPaymentPaid: (id: number) => ipcRenderer.invoke('salaryPayments:markPaid', id),
  deleteSalaryPayment: (id: number) => ipcRenderer.invoke('salaryPayments:delete', id),

  // Salary Advances (سلفيات)
  getSalaryAdvances: () => ipcRenderer.invoke('salaryAdvances:getAll'),
  getSalaryAdvancesByEmployee: (employeeId: number) => ipcRenderer.invoke('salaryAdvances:getByEmployee', employeeId),
  getUndeductedAdvances: () => ipcRenderer.invoke('salaryAdvances:getUndeducted'),
  createSalaryAdvance: (advance: any) => ipcRenderer.invoke('salaryAdvances:create', advance),
  markAdvanceDeducted: (id: number, payrollItemId: number) => ipcRenderer.invoke('salaryAdvances:markDeducted', id, payrollItemId),
  deleteSalaryAdvance: (id: number) => ipcRenderer.invoke('salaryAdvances:delete', id),

  // Salary Deductions (خصومات)
  getSalaryDeductions: () => ipcRenderer.invoke('salaryDeductions:getAll'),
  getSalaryDeductionsByEmployee: (employeeId: number) => ipcRenderer.invoke('salaryDeductions:getByEmployee', employeeId),
  getUnappliedDeductions: () => ipcRenderer.invoke('salaryDeductions:getUnapplied'),
  createSalaryDeduction: (deduction: any) => ipcRenderer.invoke('salaryDeductions:create', deduction),
  markDeductionApplied: (id: number, payrollItemId: number) => ipcRenderer.invoke('salaryDeductions:markApplied', id, payrollItemId),
  deleteSalaryDeduction: (id: number) => ipcRenderer.invoke('salaryDeductions:delete', id),

  // Payroll Runs (مسيرات الرواتب)
  getPayrollRuns: () => ipcRenderer.invoke('payrollRuns:getAll'),
  getPayrollRunById: (id: number) => ipcRenderer.invoke('payrollRuns:getById', id),
  getPayrollRunItems: (runId: number) => ipcRenderer.invoke('payrollRuns:getItems', runId),
  createPayrollRun: (month: string, notes: string) => ipcRenderer.invoke('payrollRuns:create', month, notes),
  updatePayrollItem: (itemId: number, data: any) => ipcRenderer.invoke('payrollRuns:updateItem', itemId, data),
  processPayrollRun: (runId: number) => ipcRenderer.invoke('payrollRuns:process', runId),
  markPayrollRunPaid: (runId: number) => ipcRenderer.invoke('payrollRuns:markPaid', runId),
  deletePayrollRun: (runId: number) => ipcRenderer.invoke('payrollRuns:delete', runId),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  getCurrency: () => ipcRenderer.invoke('settings:getCurrency'),
  getVatRate: () => ipcRenderer.invoke('settings:getVatRate'),

  // Invoice Items
  getInvoiceItems: (invoiceId: number) => ipcRenderer.invoke('invoiceItems:getByInvoice', invoiceId),
  createInvoiceItem: (item: any) => ipcRenderer.invoke('invoiceItems:create', item),
  deleteInvoiceItem: (id: number) => ipcRenderer.invoke('invoiceItems:delete', id),

  // Invoice Deductions
  getInvoiceDeductions: (invoiceId: number) => ipcRenderer.invoke('invoiceDeductions:getByInvoice', invoiceId),
  createInvoiceDeduction: (deduction: any) => ipcRenderer.invoke('invoiceDeductions:create', deduction),
  deleteInvoiceDeduction: (id: number) => ipcRenderer.invoke('invoiceDeductions:delete', id),

  // Reports
  getReportsPnL: (dateFrom: string, dateTo: string) => ipcRenderer.invoke('reports:pnl', dateFrom, dateTo),
  getReportsEquipment: (equipmentId: number | null, dateFrom: string, dateTo: string) => ipcRenderer.invoke('reports:equipment', equipmentId, dateFrom, dateTo),
  getReportsContracts: (dateFrom: string, dateTo: string) => ipcRenderer.invoke('reports:contracts', dateFrom, dateTo),
  getReportsExpenses: (dateFrom: string, dateTo: string) => ipcRenderer.invoke('reports:expenses', dateFrom, dateTo),

  // Statement
  getCustomerStatement: (clientId: number, dateFrom: string, dateTo: string) => ipcRenderer.invoke('statement:customer', clientId, dateFrom, dateTo),
  getEquipmentSummary: () => ipcRenderer.invoke('statement:equipmentSummary'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

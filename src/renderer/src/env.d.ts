export {}

declare global {
  interface Window {
    electron: {
      ipcRenderer: import('electron').IpcRenderer
    }
    api: {
      // Clients
      getClients: () => Promise<import('../../shared/types').Client[]>
      getClientById: (id: number) => Promise<import('../../shared/types').Client | undefined>
      createClient: (client: any) => Promise<number>
      updateClient: (id: number, client: any) => Promise<boolean>
      deleteClient: (id: number) => Promise<boolean>

      // Equipment
      getEquipment: () => Promise<import('../../shared/types').Equipment[]>
      getEquipmentById: (id: number) => Promise<import('../../shared/types').Equipment | undefined>
      createEquipment: (equipment: any) => Promise<number>
      updateEquipment: (id: number, equipment: any) => Promise<boolean>
      deleteEquipment: (id: number) => Promise<boolean>
      updateEquipmentMeter: (id: number, meter: number) => Promise<boolean>

      // Contracts
      getContracts: () => Promise<import('../../shared/types').RentalContract[]>
      getContractById: (id: number) => Promise<import('../../shared/types').RentalContract | undefined>
      createContract: (contract: any) => Promise<number>
      closeContract: (id: number, meterEnd: number) => Promise<{ invoice_id: number }>
      cancelContract: (id: number) => Promise<boolean>

      // Invoices
      getInvoices: () => Promise<import('../../shared/types').Invoice[]>
      createInvoice: (invoice: any) => Promise<number>
      updateInvoice: (id: number, invoice: any) => Promise<boolean>
      deleteInvoice: (id: number) => Promise<boolean>

      // Expenses
      getExpenses: () => Promise<import('../../shared/types').Expense[]>
      createExpense: (expense: any) => Promise<number>
      updateExpense: (id: number, expense: any) => Promise<boolean>
      deleteExpense: (id: number) => Promise<boolean>

      // Payments
      getPayments: () => Promise<import('../../shared/types').Payment[]>
      createPayment: (payment: any) => Promise<number>
      deletePayment: (id: number) => Promise<boolean>

      // Dashboard
      getDashboardStats: () => Promise<import('../../shared/types').DashboardStats>
      getEquipmentPnL: (equipmentId: number) => Promise<{ revenue: number; expenses: number; profit: number }>

      // License
      checkLicense: () => Promise<import('../../shared/types').LicenseInfo | null>
      activateLicense: (code: string) => Promise<{ success: boolean; message: string }>
      getDeviceId: () => Promise<string>

      // Drivers
      getDrivers: () => Promise<import('../../shared/types').Driver[]>
      getDriverById: (id: number) => Promise<import('../../shared/types').Driver | undefined>
      createDriver: (driver: any) => Promise<number>
      updateDriver: (id: number, driver: any) => Promise<boolean>
      deleteDriver: (id: number) => Promise<boolean>

      // Employees
      getEmployees: () => Promise<import('../../shared/types').Employee[]>
      getEmployeeById: (id: number) => Promise<import('../../shared/types').Employee | undefined>
      createEmployee: (employee: any) => Promise<number>
      updateEmployee: (id: number, employee: any) => Promise<boolean>
      deleteEmployee: (id: number) => Promise<boolean>

      // Banks
      getBanks: () => Promise<import('../../shared/types').Bank[]>
      getBankById: (id: number) => Promise<import('../../shared/types').Bank | undefined>
      createBank: (bank: any) => Promise<number>
      updateBank: (id: number, bank: any) => Promise<boolean>
      updateBankBalance: (id: number, amount: number, operation: 'add' | 'subtract') => Promise<boolean>
      deleteBank: (id: number) => Promise<boolean>

      // Custody
      getCustody: () => Promise<import('../../shared/types').Custody[]>
      getCustodyById: (id: number) => Promise<import('../../shared/types').Custody | undefined>
      getCustodyTransactions: (custodyId: number) => Promise<import('../../shared/types').CustodyTransaction[]>
      openCustody: (data: any) => Promise<number>
      depositCustody: (custodyId: number, bankId: number, amount: number, description: string) => Promise<boolean>
      purchaseCustody: (custodyId: number, vendorName: string, description: string, amount: number) => Promise<{ invoice_id: number; custody_id: number }>
      closeCustody: (custodyId: number, closingNotes: string) => Promise<{ difference: number; type: 'surplus' | 'deficit' | 'exact' }>

      // Purchase Invoices
      getPurchaseInvoices: () => Promise<import('../../shared/types').PurchaseInvoice[]>
      createPurchaseInvoice: (invoice: any) => Promise<number>
      updatePurchaseInvoice: (id: number, invoice: any) => Promise<boolean>
      deletePurchaseInvoice: (id: number) => Promise<boolean>

      // Salary Payments
      getSalaryPayments: () => Promise<any[]>
      getSalaryPaymentsByMonth: (month: string) => Promise<any[]>
      createSalaryPayment: (payment: any) => Promise<number>
      markSalaryPaymentPaid: (id: number) => Promise<boolean>
      deleteSalaryPayment: (id: number) => Promise<boolean>

      // Salary Advances
      getSalaryAdvances: () => Promise<any[]>
      getSalaryAdvancesByEmployee: (employeeId: number) => Promise<any[]>
      getUndeductedAdvances: () => Promise<any[]>
      createSalaryAdvance: (advance: any) => Promise<number>
      markAdvanceDeducted: (id: number, payrollItemId: number) => Promise<boolean>
      deleteSalaryAdvance: (id: number) => Promise<boolean>

      // Salary Deductions
      getSalaryDeductions: () => Promise<any[]>
      getSalaryDeductionsByEmployee: (employeeId: number) => Promise<any[]>
      getUnappliedDeductions: () => Promise<any[]>
      createSalaryDeduction: (deduction: any) => Promise<number>
      markDeductionApplied: (id: number, payrollItemId: number) => Promise<boolean>
      deleteSalaryDeduction: (id: number) => Promise<boolean>

      // Payroll Runs
      getPayrollRuns: () => Promise<import('../../shared/types').PayrollRun[]>
      getPayrollRunById: (id: number) => Promise<import('../../shared/types').PayrollRun | undefined>
      getPayrollRunItems: (runId: number) => Promise<import('../../shared/types').PayrollItem[]>
      createPayrollRun: (month: string, notes: string) => Promise<{ run_id: number; items_created: number }>
      updatePayrollItem: (itemId: number, data: any) => Promise<boolean>
      processPayrollRun: (runId: number) => Promise<boolean>
      markPayrollRunPaid: (runId: number) => Promise<boolean>
      deletePayrollRun: (runId: number) => Promise<boolean>

      // Settings
      getSettings: () => Promise<import('../../shared/types').AppSettings | undefined>
      saveSettings: (settings: any) => Promise<boolean>
      getCurrency: () => Promise<string>
      getVatRate: () => Promise<number>

      // Invoice Items
      getInvoiceItems: (invoiceId: number) => Promise<import('../../shared/types').InvoiceItem[]>
      createInvoiceItem: (item: any) => Promise<number>
      deleteInvoiceItem: (id: number) => Promise<boolean>

      // Invoice Deductions
      getInvoiceDeductions: (invoiceId: number) => Promise<import('../../shared/types').InvoiceDeduction[]>
      createInvoiceDeduction: (deduction: any) => Promise<number>
      deleteInvoiceDeduction: (id: number) => Promise<boolean>

      // Reports
      getReportsPnL: (dateFrom: string, dateTo: string) => Promise<any>
      getReportsEquipment: (equipmentId: number | null, dateFrom: string, dateTo: string) => Promise<any[]>
      getReportsContracts: (dateFrom: string, dateTo: string) => Promise<any[]>
      getReportsExpenses: (dateFrom: string, dateTo: string) => Promise<any[]>

      // Statement
      getCustomerStatement: (clientId: number, dateFrom: string, dateTo: string) => Promise<any>
      getEquipmentSummary: () => Promise<any[]>

      // Vouchers
      getVouchers: () => Promise<any[]>
      getVouchersByType: (type: 'pay' | 'receive') => Promise<any[]>
      createVoucher: (data: any) => Promise<number>
      updateVoucher: (id: number, data: any) => Promise<boolean>
      deleteVoucher: (id: number) => Promise<boolean>
      getVoucherReport: (type: 'pay' | 'receive', dateFrom: string, dateTo: string) => Promise<any[]>
      getVoucherEquipmentSummary: (equipmentId: number, dateFrom: string, dateTo: string) => Promise<{ total_paid: number; total_received: number; net: number }>
    }
  }
}

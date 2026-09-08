export {}

declare global {
  interface Window {
    electron: {
      ipcRenderer: import('electron').IpcRenderer
    }
    api: {
      // Clients
      getClients: () => Promise<import('../shared/types').Client[]>
      getClientById: (id: number) => Promise<import('../shared/types').Client | undefined>
      createClient: (client: any) => Promise<number>
      updateClient: (id: number, client: any) => Promise<boolean>
      deleteClient: (id: number) => Promise<boolean>

      // Equipment
      getEquipment: () => Promise<import('../shared/types').Equipment[]>
      getEquipmentById: (id: number) => Promise<import('../shared/types').Equipment | undefined>
      createEquipment: (equipment: any) => Promise<number>
      updateEquipment: (id: number, equipment: any) => Promise<boolean>
      deleteEquipment: (id: number) => Promise<boolean>
      updateEquipmentMeter: (id: number, meter: number) => Promise<boolean>

      // Contracts
      getContracts: () => Promise<import('../shared/types').RentalContract[]>
      getContractById: (id: number) => Promise<import('../shared/types').RentalContract | undefined>
      createContract: (contract: any) => Promise<number>
      closeContract: (id: number, meterEnd: number) => Promise<{ invoice_id: number }>
      cancelContract: (id: number) => Promise<boolean>

      // Invoices
      getInvoices: () => Promise<import('../shared/types').Invoice[]>
      createInvoice: (invoice: any) => Promise<number>
      deleteInvoice: (id: number) => Promise<boolean>

      // Expenses
      getExpenses: () => Promise<import('../shared/types').Expense[]>
      createExpense: (expense: any) => Promise<number>
      deleteExpense: (id: number) => Promise<boolean>

      // Payments
      getPayments: () => Promise<import('../shared/types').Payment[]>
      createPayment: (payment: any) => Promise<number>
      deletePayment: (id: number) => Promise<boolean>

      // Dashboard
      getDashboardStats: () => Promise<import('../shared/types').DashboardStats>
      getEquipmentPnL: (equipmentId: number) => Promise<{ revenue: number; expenses: number; profit: number }>

      // License
      checkLicense: () => Promise<import('../shared/types').LicenseInfo | null>
      activateLicense: (code: string) => Promise<{ success: boolean; message: string }>
      getDeviceId: () => Promise<string>
    }
  }
}

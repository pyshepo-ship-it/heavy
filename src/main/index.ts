import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDatabase, closeDatabase } from './db/schema'
import { registerClientHandlers } from './ipc/clients'
import { registerEquipmentHandlers } from './ipc/equipment'
import { registerContractHandlers } from './ipc/contracts'
import { registerLicenseHandlers } from './ipc/license'
import { registerDriverHandlers } from './ipc/drivers'
import { registerDashboardHandlers, registerExpenseHandlers, registerPaymentHandlers, registerInvoiceHandlers } from './ipc/dashboard'
import { registerEmployeeHandlers } from './ipc/employees'
import { registerBankHandlers } from './ipc/banks'
import { registerCustodyHandlers } from './ipc/custody'
import { registerPurchaseHandlers } from './ipc/purchases'
import { registerSalaryHandlers } from './ipc/salary'
import { registerPayrollHandlers } from './ipc/payroll'
import { registerSettingsHandlers } from './ipc/settings'
import { registerReportHandlers } from './ipc/reports'
import { registerStatementHandlers } from './ipc/statement'
import { registerInvoiceItemHandlers } from './ipc/invoiceItems'
import { registerInvoiceDeductionHandlers } from './ipc/invoiceDeductions'
import { registerBackupHandlers } from './ipc/backup'
import { registerVoucherHandlers } from './ipc/vouchers'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Heavy Equipment ERP',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = (details.url || '').trim()
    // Allow print popups (about:blank) without exposing Node APIs.
    if (url === '' || url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      }
    }
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.erp.heavy-equipment')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  getDatabase()

  // Register IPC handlers
  registerClientHandlers()
  registerEquipmentHandlers()
  registerContractHandlers()
  registerLicenseHandlers()
  registerDriverHandlers()
  registerDashboardHandlers()
  registerExpenseHandlers()
  registerPaymentHandlers()
  registerInvoiceHandlers()
  registerEmployeeHandlers()
  registerBankHandlers()
  registerCustodyHandlers()
  registerPurchaseHandlers()
  registerSalaryHandlers()
  registerPayrollHandlers()
  registerSettingsHandlers()
  registerReportHandlers()
  registerStatementHandlers()
  registerInvoiceItemHandlers()
  registerInvoiceDeductionHandlers()
  registerBackupHandlers()
  registerVoucherHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})

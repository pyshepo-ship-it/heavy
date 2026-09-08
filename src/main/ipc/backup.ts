import { ipcMain, app } from 'electron'
import { getDatabase, closeDatabase } from '../db/schema'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'fs'

export function registerBackupHandlers(): void {
  const dbPath = join(app.getPath('userData'), 'erp.db')
  const backupDir = join(app.getPath('appData'), 'HeavyEquipmentERP', 'backups')

  ipcMain.handle('backup:create', async (): Promise<{ success: boolean; path: string }> => {
    try {
      if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
      const dateStr = new Date().toISOString().split('T')[0]
      const backupPath = join(backupDir, `backup_${dateStr}.db`)
      const db = getDatabase()
      await db.backup(backupPath)
      return { success: true, path: backupPath }
    } catch {
      return { success: false, path: '' }
    }
  })

  ipcMain.handle('backup:list', (): Array<{ date: string; path: string; size: number }> => {
    try {
      if (!existsSync(backupDir)) return []
      const files = readdirSync(backupDir).filter((f: string) => f.endsWith('.db')).sort().reverse()
      return files.map((f: string) => {
        const p = join(backupDir, f)
        const s = statSync(p)
        return { date: f.replace('backup_', '').replace('.db', ''), path: p, size: s.size }
      })
    } catch {
      return []
    }
  })

  ipcMain.handle('backup:restore', (_, backupPath: string): boolean => {
    try {
      if (!existsSync(backupPath)) return false

      // Close the current database, replace it, then relaunch the app so
      // every IPC handler gets the freshly opened database.
      closeDatabase()
      rmSync(dbPath + '-wal', { force: true })
      rmSync(dbPath + '-shm', { force: true })
      copyFileSync(backupPath, dbPath)
      getDatabase()
      // Reload the application so all handlers use the restored database.
      setTimeout(() => {
        app.relaunch()
        app.quit()
      }, 300)
      return true
    } catch {
      return false
    }
  })
}

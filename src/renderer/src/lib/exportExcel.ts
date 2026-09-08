// Simple CSV/Excel export using Blob download
export function exportToExcel(data: Array<Record<string, any>>, filename: string, columns: { key: string; label: string }[]): void {
  // Build CSV content
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      const val = row[c.key]
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return '"' + val.replace(/"/g, '""') + '"'
      }
      return val ?? ''
    }).join(',')
  ).join('\n')
  
  const csvContent = '\uFEFF' + header + '\n' + rows + '\n'  // BOM for Arabic
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename + '.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportToExcelXLSX(data: Array<Record<string, any>>, filename: string, columns: { key: string; label: string }[]): void {
  // Try to use ExcelJS if available, otherwise fall back to CSV
  try {
    // Dynamic import for ExcelJS
    import('exceljs').then(ExcelJS => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Sheet 1')
      
      // Add header
      sheet.addRow(columns.map(c => c.label))
      
      // Add data
      data.forEach(row => {
        sheet.addRow(columns.map(c => row[c.key] ?? ''))
      })
      
      // Style header
      const headerRow = sheet.getRow(1)
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      })
      
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename + '.xlsx'
        link.click()
        URL.revokeObjectURL(link.href)
      })
    }).catch(() => {
      // Fallback to CSV
      exportToExcel(data, filename, columns)
    })
  } catch {
    exportToExcel(data, filename, columns)
  }
}

export function exportPageToPDF(): void {
  // Use window.print() for PDF printing
  window.print()
}

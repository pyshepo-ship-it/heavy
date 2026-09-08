export interface InvoiceModel {
  invoiceNumber: string
  issueDate: string
  clientName: string
  clientPhone: string
  clientAddress: string
  companyName: string
  taxNumber: string
  items: Array<{ description: string; qty: number; unitPrice: number; amount: number }>
  deductions: Array<{ type: string; description: string; amount: number }>
  subtotal: number
  vatRate: number
  vatAmount: number
  deductionsTotal: number
  total: number
  currency: string
  notes: string
}

export type TemplateName = 'modern' | 'classic' | 'compact' | 'elegant' | 'thermal'

const BASE_STYLES = [
  '* { margin: 0; padding: 0; box-sizing: border-box; }',
  'body { font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif; direction: rtl; font-size: 13px; color: #1a1a1a; background: #fff; }',
  '.items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }',
  '.print-only { display: none; }',
  '@media print {',
  '  .no-print { display: none !important; }',
  '  .print-only { display: block; }',
  '  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
  '  @page { margin: 12mm; }',
  '}',
].join('\n')

function formatCurrency(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function itemsRows(items: InvoiceModel['items'], style: string): string {
  return items
    .map(
      (item, i) =>
        `<tr style="${style} ${i % 2 === 0 ? '' : ''}">
          <td style="padding:8px 10px;border:1px solid #e0e0e0;">${i + 1}</td>
          <td style="padding:8px 10px;border:1px solid #e0e0e0;">${item.description}</td>
          <td style="padding:8px 10px;border:1px solid #e0e0e0;text-align:center;">${item.qty}</td>
          <td style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;">${formatCurrency(item.unitPrice, '')}</td>
          <td style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;font-weight:600;">${formatCurrency(item.amount, '')}</td>
        </tr>`
    )
    .join('\n')
}

function deductionsRows(deductions: InvoiceModel['deductions'], style: string): string {
  if (deductions.length === 0) return ''
  return deductions
    .map(
      (d, i) =>
        `<tr style="${style}">
          <td style="padding:6px 10px;border:1px solid #e0e0e0;">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #e0e0e0;">${d.type}</td>
          <td style="padding:6px 10px;border:1px solid #e0e0e0;">${d.description}</td>
          <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:left;">-${formatCurrency(d.amount, '')}</td>
        </tr>`
    )
    .join('\n')
}

export function modernTemplate(model: InvoiceModel): string {
  const itemsHtml = itemsRows(model.items, '')
  const deductionsHtml = deductionsRows(model.deductions, 'background:#fff8f0;')
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Invoice ' + model.invoiceNumber + '</title>',
    '  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    BASE_STYLES,
    '  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d6aa0 100%); color: #fff; padding: 32px 40px; text-align: center; }',
    '  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }',
    '  .header .invoice-title { font-size: 14px; opacity: 0.85; letter-spacing: 2px; text-transform: uppercase; }',
    '  .company-name { font-size: 18px; font-weight: 600; margin-bottom: 6px; }',
    '  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 20px 40px; background: #f7fafd; border-bottom: 1px solid #e2e8f0; }',
    '  .info-box { background: #fff; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0; }',
    '  .info-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }',
    '  .info-box .value { font-size: 13px; font-weight: 500; }',
    '  .section-title { font-size: 13px; font-weight: 600; color: #1e3a5f; padding: 8px 12px; background: #f1f5f9; border-radius: 4px; margin: 16px 40px 0; }',
    '  .items-table th { background: #1e3a5f; color: #fff; padding: 10px 12px; font-size: 12px; font-weight: 600; text-align: right; }',
    '  .items-table td { font-size: 12px; }',
    '  .totals-box { padding: 16px 40px; text-align: left; }',
    '  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }',
    '  .totals-row.total { border-top: 2px solid #1e3a5f; margin-top: 6px; padding-top: 10px; font-size: 18px; font-weight: 700; color: #1e3a5f; }',
    '  .totals-row.deduction { color: #dc2626; }',
    '  .notes { padding: 16px 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }',
    '  .notes strong { color: #1e3a5f; }',
    '  @media print { .header { padding: 24px 32px; } .info-grid { padding: 16px 32px; } .section-title { margin: 12px 32px 0; } .totals-box { padding: 12px 32px; } .notes { padding: 12px 32px; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="header">',
    '    <div class="company-name">' + model.companyName + '</div>',
    '    <div class="invoice-title">فاتورة / Invoice</div>',
    '  </div>',
    '  <div class="info-grid">',
    '    <div class="info-box"><div class="label">رقم الفاتورة / Invoice #</div><div class="value">' + model.invoiceNumber + '</div></div>',
    '    <div class="info-box"><div class="label">التاريخ / Date</div><div class="value">' + model.issueDate + '</div></div>',
    '    <div class="info-box"><div class="label">العميل / Client</div><div class="value">' + model.clientName + '</div></div>',
    '    <div class="info-box"><div class="label">الهاتف / Phone</div><div class="value">' + model.clientPhone + '</div></div>',
    '    <div class="info-box"><div class="label">العنوان / Address</div><div class="value">' + model.clientAddress + '</div></div>',
    '    <div class="info-box"><div class="label">الرقم الضريبي / Tax #</div><div class="value">' + model.taxNumber + '</div></div>',
    '  </div>',
    '  <div class="section-title">تفاصيل الأصناف / Items</div>',
    '  <div style="padding:0 40px;">',
    '    <table class="items-table">',
    '      <thead><tr>',
    '        <th style="width:40px;">#</th>',
    '        <th style="text-align:right;">الوصف / Description</th>',
    '        <th style="width:70px;text-align:center;">الكمية / Qty</th>',
    '        <th style="width:110px;">سعر الوحدة / Unit Price</th>',
    '        <th style="width:120px;">المبلغ / Amount</th>',
    '      </tr></thead>',
    '      <tbody>' + itemsHtml + '</tbody>',
    '    </table>',
    '  </div>',
    (model.deductions.length > 0
      ? '  <div class="section-title" style="margin-top:8px;">الخصومات / Deductions</div>\n  <div style="padding:0 40px;"><table class="items-table"><thead><tr><th style="width:40px;">#</th><th style="text-align:right;">النوع / Type</th><th style="text-align:right;">الوصف / Description</th><th style="width:120px;">المبلغ / Amount</th></tr></thead><tbody>' + deductionsHtml + '</tbody></table></div>'
      : ''),
    '  <div class="totals-box">',
    '    <div class="totals-row"><span>المجموع الفرعي / Subtotal</span><span>' + formatCurrency(model.subtotal, model.currency) + '</span></div>',
    '    <div class="totals-row"><span>الضريبة ' + model.vatRate + '% / VAT</span><span>' + formatCurrency(model.vatAmount, model.currency) + '</span></div>',
    (model.deductions.length > 0
      ? '    <div class="totals-row deduction"><span>الخصومات / Deductions</span><span>-' + formatCurrency(model.deductionsTotal, model.currency) + '</span></div>'
      : ''),
    '    <div class="totals-row total"><span>الإجمالي / Total</span><span>' + formatCurrency(model.total, model.currency) + '</span></div>',
    '  </div>',
    (model.notes
      ? '  <div class="notes"><strong>ملاحظات / Notes:</strong> ' + model.notes + '</div>'
      : ''),
    '</body>',
    '</html>',
  ].join('\n')
}

export function classicTemplate(model: InvoiceModel): string {
  const itemsHtml = itemsRows(model.items, 'background:#fff;')
  const deductionsHtml = deductionsRows(model.deductions, 'background:#fff;')
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Invoice ' + model.invoiceNumber + '</title>',
    '  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    BASE_STYLES,
    '  .invoice-wrapper { border: 2px solid #1a1a1a; margin: 16px; }',
    '  .header { border-bottom: 3px double #1a1a1a; padding: 24px 32px; text-align: center; }',
    '  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }',
    '  .header .subtitle { font-size: 13px; color: #555; letter-spacing: 1px; text-transform: uppercase; }',
    '  .company-name { font-size: 20px; font-weight: 700; margin-bottom: 2px; }',
    '  .tax-info { font-size: 12px; color: #555; }',
    '  .info-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #1a1a1a; }',
    '  .info-table td { padding: 10px 16px; border: 1px solid #1a1a1a; font-size: 12px; vertical-align: top; }',
    '  .info-table .label { background: #f0f0f0; font-weight: 600; width: 140px; color: #333; }',
    '  .section-header { font-size: 13px; font-weight: 700; padding: 8px 16px; background: #f0f0f0; border: 1px solid #1a1a1a; margin-top: 16px; margin-left: 16px; margin-right: 16px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '  .items-table th { background: #2c2c2c; color: #fff; padding: 8px 10px; font-size: 11px; font-weight: 600; border: 1px solid #1a1a1a; text-align: right; }',
    '  .items-table td { font-size: 12px; padding: 7px 10px; border: 1px solid #1a1a1a; }',
    '  .totals-table { margin-left: 16px; margin-right: 16px; width: 300px; border-collapse: collapse; margin-top: 16px; }',
    '  .totals-table td { padding: 8px 12px; border: 1px solid #1a1a1a; font-size: 13px; }',
    '  .totals-table .label-cell { background: #f0f0f0; font-weight: 600; width: 160px; }',
    '  .totals-table .total-row td { background: #2c2c2c; color: #fff; font-weight: 700; font-size: 15px; }',
    '  .totals-table .deduction td { color: #c00; }',
    '  .notes { padding: 12px 16px; font-size: 12px; color: #555; border-top: 1px solid #1a1a1a; margin-top: 16px; }',
    '  .notes strong { color: #1a1a1a; }',
    '  @media print { .invoice-wrapper { margin: 0; border: 2px solid #000; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="invoice-wrapper">',
    '    <div class="header">',
    '      <div class="company-name">' + model.companyName + '</div>',
    '      <div class="tax-info">الرقم الضريبي: ' + model.taxNumber + '</div>',
    '      <h1>فاتورة / INVOICE</h1>',
    '      <div class="subtitle">Tax Invoice</div>',
    '    </div>',
    '    <table class="info-table">',
    '      <tr><td class="label">رقم الفاتورة / Invoice #</td><td>' + model.invoiceNumber + '</td><td class="label">التاريخ / Date</td><td>' + model.issueDate + '</td></tr>',
    '      <tr><td class="label">العميل / Client</td><td>' + model.clientName + '</td><td class="label">الهاتف / Phone</td><td>' + model.clientPhone + '</td></tr>',
    '      <tr><td class="label">العنوان / Address</td><td colspan="3">' + model.clientAddress + '</td></tr>',
    '    </table>',
    '    <div class="section-header">تفاصيل الأصناف / Items</div>',
    '    <div style="padding:0 16px;">',
    '      <table class="items-table">',
    '        <thead><tr>',
    '          <th style="width:40px;">#</th>',
    '          <th style="text-align:right;">الوصف / Description</th>',
    '          <th style="width:70px;text-align:center;">الكمية / Qty</th>',
    '          <th style="width:110px;">سعر الوحدة / Unit Price</th>',
    '          <th style="width:120px;">المبلغ / Amount</th>',
    '        </tr></thead>',
    '        <tbody>' + itemsHtml + '</tbody>',
    '      </table>',
    '    </div>',
    (model.deductions.length > 0
      ? '    <div class="section-header" style="margin-top:8px;">الخصومات / Deductions</div>\n    <div style="padding:0 16px;"><table class="items-table"><thead><tr><th style="width:40px;">#</th><th style="text-align:right;">النوع / Type</th><th style="text-align:right;">الوصف / Description</th><th style="width:120px;">المبلغ / Amount</th></tr></thead><tbody>' + deductionsHtml + '</tbody></table></div>'
      : ''),
    '    <table class="totals-table">',
    '      <tr><td class="label-cell">المجموع الفرعي / Subtotal</td><td style="text-align:left;">' + formatCurrency(model.subtotal, model.currency) + '</td></tr>',
    '      <tr><td class="label-cell">الضريبة ' + model.vatRate + '% / VAT</td><td style="text-align:left;">' + formatCurrency(model.vatAmount, model.currency) + '</td></tr>',
    (model.deductions.length > 0
      ? '      <tr class="deduction"><td class="label-cell">الخصومات / Deductions</td><td style="text-align:left;">-' + formatCurrency(model.deductionsTotal, model.currency) + '</td></tr>'
      : ''),
    '      <tr class="total-row"><td>الإجمالي / Total</td><td style="text-align:left;">' + formatCurrency(model.total, model.currency) + '</td></tr>',
    '    </table>',
    (model.notes
      ? '    <div class="notes"><strong>ملاحظات / Notes:</strong> ' + model.notes + '</div>'
      : ''),
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function compactTemplate(model: InvoiceModel): string {
  const compactRow = (items: InvoiceModel['items']): string =>
    items
      .map(
        (item, i) =>
          '<tr style="border-bottom:1px solid #e5e7eb;">' +
          '<td style="padding:4px 6px;font-size:11px;border-left:1px solid #e5e7eb;">' + (i + 1) + '</td>' +
          '<td style="padding:4px 6px;font-size:11px;border-left:1px solid #e5e7eb;">' + item.description + '</td>' +
          '<td style="padding:4px 6px;font-size:11px;border-left:1px solid #e5e7eb;text-align:center;">' + item.qty + '</td>' +
          '<td style="padding:4px 6px;font-size:11px;border-left:1px solid #e5e7eb;text-align:left;">' + formatNumber(item.unitPrice) + '</td>' +
          '<td style="padding:4px 6px;font-size:11px;text-align:left;font-weight:600;">' + formatNumber(item.amount) + '</td>' +
          '</tr>'
      )
      .join('')

  const compactDeductionRows = (deductions: InvoiceModel['deductions']): string =>
    deductions
      .map(
        (d, i) =>
          '<tr style="border-bottom:1px solid #e5e7eb;background:#fef2f2;">' +
          '<td style="padding:3px 6px;font-size:10px;border-left:1px solid #e5e7eb;">' + (i + 1) + '</td>' +
          '<td style="padding:3px 6px;font-size:10px;border-left:1px solid #e5e7eb;">' + d.type + '</td>' +
          '<td style="padding:3px 6px;font-size:10px;border-left:1px solid #e5e7eb;">' + d.description + '</td>' +
          '<td style="padding:3px 6px;font-size:10px;text-align:left;">-' + formatNumber(d.amount) + '</td>' +
          '</tr>'
      )
      .join('')

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Invoice ' + model.invoiceNumber + '</title>',
    '  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    BASE_STYLES,
    '  body { font-size: 11px; }',
    '  .compact-wrapper { padding: 12px 20px; }',
    '  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; margin-bottom: 8px; }',
    '  .company-name { font-size: 16px; font-weight: 700; }',
    '  .invoice-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }',
    '  .info-row { display: flex; gap: 16px; font-size: 11px; padding: 4px 0; }',
    '  .info-row .label { color: #888; min-width: 80px; }',
    '  .section-label { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 0 2px; border-bottom: 1px solid #d1d5db; margin-top: 6px; }',
    '  .items-table th { background: #f3f4f6; padding: 4px 6px; font-size: 10px; font-weight: 600; border: 1px solid #e5e7eb; text-align: right; color: #374151; }',
    '  .totals-section { margin-top: 8px; text-align: left; }',
    '  .totals-section .row { display: flex; justify-content: flex-end; padding: 2px 0; font-size: 11px; gap: 32px; }',
    '  .totals-section .row.total { border-top: 1px solid #1a1a1a; margin-top: 4px; padding-top: 4px; font-size: 14px; font-weight: 700; }',
    '  .totals-section .row.deduction { color: #dc2626; }',
    '  .totals-section .row-label { min-width: 120px; text-align: right; }',
    '  .notes { font-size: 10px; color: #888; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; }',
    '  @media print { .compact-wrapper { padding: 8px 12px; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="compact-wrapper">',
    '    <div class="header">',
    '      <div><div class="company-name">' + model.companyName + '</div><div class="invoice-label">فاتورة / Invoice</div></div>',
    '      <div style="text-align:left;"><div style="font-weight:600;">#' + model.invoiceNumber + '</div><div style="font-size:10px;color:#888;">' + model.issueDate + '</div></div>',
    '    </div>',
    '    <div class="info-row"><span class="label">العميل:</span><span>' + model.clientName + '</span><span class="label" style="margin-right:8px;">الهاتف:</span><span>' + model.clientPhone + '</span></div>',
    '    <div class="info-row"><span class="label">العنوان:</span><span>' + model.clientAddress + '</span><span class="label" style="margin-right:8px;">الرقم الضريبي:</span><span>' + model.taxNumber + '</span></div>',
    '    <div class="section-label">الأصناف / Items</div>',
    '    <table class="items-table">',
    '      <thead><tr>',
    '        <th style="width:30px;">#</th>',
    '        <th style="text-align:right;">الوصف</th>',
    '        <th style="width:50px;text-align:center;">الكمية</th>',
    '        <th style="width:80px;">السعر</th>',
    '        <th style="width:90px;">المبلغ</th>',
    '      </tr></thead>',
    '      <tbody>' + compactRow(model.items) + '</tbody>',
    '    </table>',
    (model.deductions.length > 0
      ? '    <div class="section-label">الخصومات / Deductions</div>\n    <table class="items-table"><thead><tr><th style="width:30px;">#</th><th style="text-align:right;">النوع</th><th style="text-align:right;">الوصف</th><th style="width:90px;">المبلغ</th></tr></thead><tbody>' + compactDeductionRows(model.deductions) + '</tbody></table>'
      : ''),
    '    <div class="totals-section">',
    '      <div class="row"><span class="row-label">المجموع الفرعي:</span><span>' + formatCurrency(model.subtotal, model.currency) + '</span></div>',
    '      <div class="row"><span class="row-label">الضريبة ' + model.vatRate + '%:</span><span>' + formatCurrency(model.vatAmount, model.currency) + '</span></div>',
    (model.deductions.length > 0
      ? '      <div class="row deduction"><span class="row-label">الخصومات:</span><span>-' + formatCurrency(model.deductionsTotal, model.currency) + '</span></div>'
      : ''),
    '      <div class="row total"><span class="row-label">الإجمالي:</span><span>' + formatCurrency(model.total, model.currency) + '</span></div>',
    '    </div>',
    (model.notes
      ? '    <div class="notes"><strong>ملاحظات:</strong> ' + model.notes + '</div>'
      : ''),
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function elegantTemplate(model: InvoiceModel): string {
  const itemsHtml = itemsRows(model.items, 'background:#fafafa;')
  const deductionsHtml = deductionsRows(model.deductions, 'background:#fafafa;')
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Invoice ' + model.invoiceNumber + '</title>',
    '  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    BASE_STYLES,
    '  .elegant-wrapper { padding: 0; }',
    '  .logo-area { text-align: center; padding: 40px 32px 24px; }',
    '  .company-name { font-family: "Playfair Display", serif; font-size: 28px; font-weight: 700; color: #2d2d2d; letter-spacing: 1px; }',
    '  .tax-line { font-size: 11px; color: #999; margin-top: 4px; }',
    '  .divider { height: 1px; background: linear-gradient(to right, transparent, #c9b99a, transparent); margin: 0 40px; }',
    '  .invoice-title-area { text-align: center; padding: 20px 0; }',
    '  .invoice-title { font-family: "Playfair Display", serif; font-size: 18px; font-weight: 500; color: #555; letter-spacing: 3px; text-transform: uppercase; }',
    '  .badge { display: inline-block; background: #c9b99a; color: #fff; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; letter-spacing: 0.5px; }',
    '  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 16px 48px; }',
    '  .info-block { padding: 10px 0; }',
    '  .info-block .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }',
    '  .info-block .value { font-size: 13px; color: #333; }',
    '  .info-block .separator { height: 1px; background: #eee; margin-top: 8px; }',
    '  .section-title { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1.5px; padding: 12px 48px 6px; }',
    '  .items-table th { background: #3d3d3d; color: #e8e0d0; padding: 10px 12px; font-size: 11px; font-weight: 500; text-align: right; letter-spacing: 0.5px; }',
    '  .items-table td { font-size: 12px; padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }',
    '  .items-table tbody tr:last-child td { border-bottom: 2px solid #3d3d3d; }',
    '  .totals-area { padding: 16px 48px; display: flex; justify-content: flex-end; }',
    '  .totals-table { width: 320px; }',
    '  .totals-table .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #666; }',
    '  .totals-table .row.total { border-top: 2px solid #3d3d3d; margin-top: 6px; padding-top: 8px; font-size: 17px; font-weight: 700; color: #2d2d2d; }',
    '  .totals-table .row.deduction { color: #c00; }',
    '  .notes { padding: 16px 48px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; }',
    '  .footer { text-align: center; padding: 20px 32px; font-size: 10px; color: #bbb; letter-spacing: 0.5px; }',
    '  @media print { .elegant-wrapper { padding: 0; } .logo-area { padding: 28px 32px 16px; } .info-grid { padding: 12px 32px; } .section-title { padding: 8px 32px 4px; } .totals-area { padding: 12px 32px; } .notes { padding: 12px 32px; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="elegant-wrapper">',
    '    <div class="logo-area">',
    '      <div class="company-name">' + model.companyName + '</div>',
    '      <div class="tax-line">الرقم الضريبي: ' + model.taxNumber + '</div>',
    '    </div>',
    '    <div class="divider"></div>',
    '    <div class="invoice-title-area">',
    '      <div class="invoice-title">فاتورة / Invoice</div>',
    '      <div class="badge"># ' + model.invoiceNumber + '</div>',
    '    </div>',
    '    <div class="info-grid">',
    '      <div class="info-block"><div class="label">رقم الفاتورة</div><div class="value">' + model.invoiceNumber + '</div><div class="separator"></div></div>',
    '      <div class="info-block"><div class="label">التاريخ</div><div class="value">' + model.issueDate + '</div><div class="separator"></div></div>',
    '      <div class="info-block"><div class="label">العميل</div><div class="value">' + model.clientName + '</div><div class="separator"></div></div>',
    '      <div class="info-block"><div class="label">الهاتف</div><div class="value">' + model.clientPhone + '</div><div class="separator"></div></div>',
    '      <div class="info-block" style="grid-column:1/-1;"><div class="label">العنوان</div><div class="value">' + model.clientAddress + '</div><div class="separator"></div></div>',
    '    </div>',
    '    <div class="section-title">تفاصيل الأصناف / Items</div>',
    '    <div style="padding:0 48px;">',
    '      <table class="items-table">',
    '        <thead><tr>',
    '          <th style="width:36px;">#</th>',
    '          <th style="text-align:right;">الوصف / Description</th>',
    '          <th style="width:65px;text-align:center;">الكمية</th>',
    '          <th style="width:100px;">سعر الوحدة</th>',
    '          <th style="width:110px;">المبلغ</th>',
    '        </tr></thead>',
    '        <tbody>' + itemsHtml + '</tbody>',
    '      </table>',
    '    </div>',
    (model.deductions.length > 0
      ? '    <div class="section-title" style="margin-top:4px;">الخصومات / Deductions</div>\n    <div style="padding:0 48px;"><table class="items-table"><thead><tr><th style="width:36px;">#</th><th style="text-align:right;">النوع</th><th style="text-align:right;">الوصف</th><th style="width:110px;">المبلغ</th></tr></thead><tbody>' + deductionsHtml + '</tbody></table></div>'
      : ''),
    '    <div class="totals-area">',
    '      <div class="totals-table">',
    '        <div class="row"><span>المجموع الفرعي</span><span>' + formatCurrency(model.subtotal, model.currency) + '</span></div>',
    '        <div class="row"><span>الضريبة ' + model.vatRate + '%</span><span>' + formatCurrency(model.vatAmount, model.currency) + '</span></div>',
    (model.deductions.length > 0
      ? '        <div class="row deduction"><span>الخصومات</span><span>-' + formatCurrency(model.deductionsTotal, model.currency) + '</span></div>'
      : ''),
    '        <div class="row total"><span>الإجمالي</span><span>' + formatCurrency(model.total, model.currency) + '</span></div>',
    '      </div>',
    '    </div>',
    (model.notes
      ? '    <div class="notes"><strong>ملاحظات / Notes:</strong> ' + model.notes + '</div>'
      : ''),
    '    <div class="footer">' + model.companyName + ' &mdash; ' + model.taxNumber + '</div>',
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function thermalTemplate(model: InvoiceModel): string {
  const thermalRow = (items: InvoiceModel['items']): string =>
    items
      .map(
        (item) =>
          '<tr>' +
          '<td style="padding:2px 0;font-size:10px;">' + item.description + '</td>' +
          '<td style="padding:2px 0;font-size:10px;text-align:center;">x' + item.qty + '</td>' +
          '<td style="padding:2px 0;font-size:10px;text-align:left;">' + formatNumber(item.amount) + '</td>' +
          '</tr>'
      )
      .join('')

  const thermalDeductionRows = (deductions: InvoiceModel['deductions']): string =>
    deductions
      .map(
        (d) =>
          '<tr>' +
          '<td style="padding:2px 0;font-size:9px;">- ' + d.type + ' (' + d.description + ')</td>' +
          '<td style="padding:2px 0;font-size:9px;text-align:left;">' + formatNumber(d.amount) + '</td>' +
          '</tr>'
      )
      .join('')

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Invoice ' + model.invoiceNumber + '</title>',
    '  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
    '  <style>',
    BASE_STYLES,
    '  body { font-family: "IBM Plex Sans Arabic", "Courier New", monospace; }',
    '  .thermal-wrapper { width: 296px; margin: 0 auto; padding: 12px 8px; font-family: "IBM Plex Sans Arabic", "Courier New", monospace; }',
    '  .center { text-align: center; }',
    '  .company-name { font-size: 14px; font-weight: 700; }',
    '  .tax-info { font-size: 9px; color: #666; }',
    '  .title { font-size: 12px; font-weight: 600; margin: 6px 0 2px; }',
    '  .line { border: none; border-top: 1px dashed #999; margin: 4px 0; }',
    '  .line-double { border: none; border-top: 2px solid #333; margin: 6px 0; }',
    '  .info-row { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }',
    '  .info-row .lbl { color: #666; }',
    '  .section-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 2px; }',
    '  .items-table { width: 100%; border-collapse: collapse; }',
    '  .items-table th { font-size: 9px; font-weight: 600; color: #666; padding: 2px 0; border-bottom: 1px solid #333; text-align: right; }',
    '  .totals-area { margin-top: 4px; }',
    '  .totals-row { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }',
    '  .totals-row.total { border-top: 2px solid #333; margin-top: 3px; padding-top: 3px; font-size: 13px; font-weight: 700; }',
    '  .totals-row.deduction { color: #c00; }',
    '  .notes { font-size: 9px; color: #888; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #999; text-align: center; }',
    '  .footer { text-align: center; font-size: 8px; color: #aaa; margin-top: 8px; }',
    '  @media print { .thermal-wrapper { width: 80mm; padding: 4px; } @page { size: 80mm auto; margin: 2mm; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="thermal-wrapper">',
    '    <div class="center">',
    '      <div class="company-name">' + model.companyName + '</div>',
    '      <div class="tax-info">الرقم الضريبي: ' + model.taxNumber + '</div>',
    '    </div>',
    '    <hr class="line-double">',
    '    <div class="center title">فاتورة / INVOICE</div>',
    '    <hr class="line">',
    '    <div class="info-row"><span class="lbl">الفاتورة:</span><span>#' + model.invoiceNumber + '</span></div>',
    '    <div class="info-row"><span class="lbl">التاريخ:</span><span>' + model.issueDate + '</span></div>',
    '    <div class="info-row"><span class="lbl">العميل:</span><span>' + model.clientName + '</span></div>',
    '    <div class="info-row"><span class="lbl">الهاتف:</span><span>' + model.clientPhone + '</span></div>',
    '    <div class="info-row"><span class="lbl">العنوان:</span><span>' + model.clientAddress + '</span></div>',
    '    <hr class="line">',
    '    <div class="section-label">الأصناف / Items</div>',
    '    <table class="items-table">',
    '      <thead><tr>',
    '        <th style="text-align:right;">الوصف</th>',
    '        <th style="width:40px;text-align:center;">الكمية</th>',
    '        <th style="width:70px;">المبلغ</th>',
    '      </tr></thead>',
    '      <tbody>' + thermalRow(model.items) + '</tbody>',
    '    </table>',
    (model.deductions.length > 0
      ? '    <div class="section-label">الخصومات / Deductions</div>\n    <table class="items-table"><tbody>' + thermalDeductionRows(model.deductions) + '</tbody></table>'
      : ''),
    '    <hr class="line">',
    '    <div class="totals-area">',
    '      <div class="totals-row"><span>المجموع الفرعي</span><span>' + formatCurrency(model.subtotal, model.currency) + '</span></div>',
    '      <div class="totals-row"><span>الضريبة ' + model.vatRate + '%</span><span>' + formatCurrency(model.vatAmount, model.currency) + '</span></div>',
    (model.deductions.length > 0
      ? '      <div class="totals-row deduction"><span>الخصومات</span><span>-' + formatCurrency(model.deductionsTotal, model.currency) + '</span></div>'
      : ''),
    '      <div class="totals-row total"><span>الإجمالي</span><span>' + formatCurrency(model.total, model.currency) + '</span></div>',
    '    </div>',
    (model.notes
      ? '    <div class="notes">' + model.notes + '</div>'
      : ''),
    '    <hr class="line-double">',
    '    <div class="footer">شكراً لتعاملكم معنا</div>',
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function renderInvoiceTemplate(name: TemplateName, model: InvoiceModel): string {
  switch (name) {
    case 'modern':
      return modernTemplate(model)
    case 'classic':
      return classicTemplate(model)
    case 'compact':
      return compactTemplate(model)
    case 'elegant':
      return elegantTemplate(model)
    case 'thermal':
      return thermalTemplate(model)
    default:
      return modernTemplate(model)
  }
}

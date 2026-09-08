import React, { useEffect, useState } from 'react'
import { FileText, Printer, Search } from 'lucide-react'
import type { Client } from '@shared/types'

interface Transaction {
  date: string
  type: string
  doc_number: string
  description: string
  debit: number
  credit: number
}

interface StatementData {
  opening_balance: number
  transactions: Transaction[]
  total_debit: number
  total_credit: number
  closing_balance: number
}

export default function CustomerStatement() {
  const hash = window.location.hash.split('?')[1] || ''
  const params = new URLSearchParams(hash || window.location.search)
  const urlClientId = params.get('client')
  const [selectedClient, setSelectedClient] = useState<number>(urlClientId ? Number(urlClientId) : 0)
  const [clients, setClients] = useState<Client[]>([])
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [statement, setStatement] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClientInfo, setSelectedClientInfo] = useState<Client | null>(null)
  const [currency, setCurrency] = useState('ر.س')

  useEffect(() => {
    window.api.getClients().then(setClients); window.api.getSettings().then((s) => { if (s && s.currency) setCurrency(s.currency) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (urlClientId) {
      handleShowStatement()
    }
  }, [])

  const handleShowStatement = async () => {
    if (!selectedClient) return
    setLoading(true)
    try {
      const list = clients.length > 0 ? clients : await window.api.getClients()
      if (clients.length === 0) setClients(list)
      const data = await window.api.getCustomerStatement(selectedClient, dateFrom, dateTo)
      setStatement(data)
      const client = list.find((c: Client) => c.id === selectedClient) || null
      setSelectedClientInfo(client)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    val.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getRunningBalance = (transactions: Transaction[], index: number, opening: number) => {
    let bal = opening;
    for (let i = 0; i <= index; i++) {
      bal += transactions[i].debit - transactions[i].credit;
    }
    return bal;
  }

  const handlePrint = () => {
    if (!statement || !selectedClientInfo) return

    const rows = statement.transactions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t, i) => {
        const bal = getRunningBalance(statement.transactions, i, statement.opening_balance)
        return [
          "<tr>",
          "<td>" + t.date + "</td>",
          "<td>" + t.doc_number + "</td>",
          "<td>" + t.description + "</td>",
          "<td class=\"num\">" + (t.debit > 0 ? currency + ' ' + formatCurrency(t.debit) : "-") + "</td>",
          "<td class=\"num\">" + (t.credit > 0 ? currency + ' ' + formatCurrency(t.credit) : "-") + "</td>",
          "<td class=\"num\">" + currency + ' ' + formatCurrency(bal) + "</td>",
          "</tr>"
        ].join("\n");
      }).join("\n");

    const closingColor = statement.closing_balance > 0 ? "#16a34a" : statement.closing_balance < 0 ? "#dc2626" : "#6b7280"
    const balanceLabel = statement.closing_balance > 0 ? "عليه" : statement.closing_balance < 0 ? "له" : ""

    const html = [
      "<!DOCTYPE html>",
      "<html lang=\"ar\" dir=\"rtl\">",
      "<head>",
      "<meta charset=\"UTF-8\">",
      "<title>كشف حساب عميل</title>",
      "<style>",
      "* { margin: 0; padding: 0; box-sizing: border-box; }",
      "body { font-family: \"Segoe UI\", Tahoma, sans-serif; padding: 20px; color: #1e293b; direction: rtl; }",
      ".header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }",
      ".company-name { font-size: 14px; color: #1e40af; margin-bottom: 4px; font-weight: 700; }",
      ".header h1 { font-size: 24px; color: #1e40af; margin-bottom: 5px; }",
      ".meta { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 15px; }",
      ".client-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 15px; display: flex; gap: 30px; font-size: 13px; }",
      ".client-card span { font-weight: 600; }",
      ".summary { display: flex; gap: 15px; margin-bottom: 20px; }",
      ".summary-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: center; }",
      ".summary-box .label { font-size: 11px; color: #64748b; margin-bottom: 4px; }",
      ".summary-box .value { font-size: 16px; font-weight: 700; }",
      "table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }",
      "th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: right; }",
      "th { background: #1e40af; color: white; font-weight: 600; }",
      "tr:nth-child(even) { background: #f8fafc; }",
      ".num { text-align: center; font-variant-numeric: tabular-nums; }",
      ".footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; }",
      ".sig-area { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }",
      ".sig-box { width: 45%; text-align: center; border-top: 1px solid #334155; padding-top: 8px; }",
      "</style>",
      "</head>",
      "<body>",
      "<div class=\"header\">",
      "<div class=\"company-name\">مِعدَات ثقيلة</div>",
      "<h1>كشف حساب عميل</h1>",
      "</div>",
      "<div class=\"meta\">",
      "<span>من: " + dateFrom + " \u2014 إلى: " + dateTo + "</span>",
      "<span>تاريخ الطباعة: " + new Date().toLocaleDateString("ar-EG") + "</span>",
      "</div>",
      "<div class=\"client-card\">",
      "<div>اسم العميل: <span>" + selectedClientInfo.name + "</span></div>",
      "<div>الكود: <span>" + selectedClientInfo.id + "</span></div>",
      "<div>الهاتف: <span>" + selectedClientInfo.phone + "</span></div>",
      "<div>العنوان: <span>" + (selectedClientInfo.address || "-") + "</span></div>",
      "</div>",
      "<div class=\"summary\">",
      "<div class=\"summary-box\"><div class=\"label\">الرصيد الافتتاحي</div><div class=\"value\">" + currency + ' ' + formatCurrency(statement.opening_balance) + "</div></div>",
      "<div class=\"summary-box\"><div class=\"label\">إجمالي الفواتير (مدين)</div><div class=\"value\" style=\"color:#dc2626\">" + currency + ' ' + formatCurrency(statement.total_debit) + "</div></div>",
      "<div class=\"summary-box\"><div class=\"label\">إجمالي التحصيل (دائن)</div><div class=\"value\" style=\"color:#16a34a\">" + currency + ' ' + formatCurrency(statement.total_credit) + "</div></div>",
      "<div class=\"summary-box\"><div class=\"label\">الرصيد الختامي " + balanceLabel + "</div><div class=\"value\" style=\"color:" + closingColor + "\">" + currency + ' ' + formatCurrency(statement.closing_balance) + "</div></div>",
      "</div>",
      "<table>",
      "<thead><tr><th>التاريخ</th><th>المستند</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>",
      "<tbody>" + rows + "</tbody>",
      "</table>",
      "<div class=\"footer\">يرجى مطابقة هذا الكشف خلال ١٥ يوماً</div>",
      "<div class=\"sig-area\">",
      "<div class=\"sig-box\">توقيع العميل</div>",
      "<div class=\"sig-box\">توقيع المحاسب</div>",
      "</div>",
      "</body>",
      "</html>"
    ].join("\n");

    const printWindow = window.open('', '_blank', 'width=800,height=600,menubar=yes,toolbar=no')
    if (printWindow) {
      printWindow.document.write('<html><head><meta charset="UTF-8"><title>كشف حساب عميل</title></head><body></body></html>')
      printWindow.document.close()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6" /> كشف حساب عميل
          </h1>
          <p className="text-slate-500 dark:text-slate-400">عرض كشف حساب تفصيلي للعميل</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">العميل</label>
            <select value={selectedClient} onChange={(e) => setSelectedClient(Number(e.target.value))} className="select-field">
              <option value={0}>-- اختر العميل --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
          </div>
          <button onClick={handleShowStatement} disabled={!selectedClient || loading} className="btn-primary flex items-center gap-2 justify-center">
            <Search className="w-4 h-4" />
            {loading ? "جاري التحميل..." : "عرض الكشف"}
          </button>
        </div>
      </div>

      {statement && selectedClientInfo && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">نتائج الكشف</h2>
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <Printer className="w-4 h-4" /> طباعة
            </button>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">بيانات العميل</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500">الاسم: </span><span className="font-medium">{selectedClientInfo.name}</span></div>
              <div><span className="text-slate-500">الكود: </span><span className="font-medium">{selectedClientInfo.id}</span></div>
              <div><span className="text-slate-500">الهاتف: </span><span className="font-medium">{selectedClientInfo.phone}</span></div>
              <div><span className="text-slate-500">العنوان: </span><span className="font-medium">{selectedClientInfo.address || "-"}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">الرصيد الافتتاحي</div>
              <div className="text-lg font-bold">{currency} {formatCurrency(statement.opening_balance)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">إجمالي الفواتير (مدين)</div>
              <div className="text-lg font-bold text-red-600">{currency} {formatCurrency(statement.total_debit)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">إجمالي التحصيل (دائن)</div>
              <div className="text-lg font-bold text-green-600">{currency} {formatCurrency(statement.total_credit)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">الرصيد الختامي</div>
              <div className={"text-lg font-bold " + (statement.closing_balance > 0 ? "text-green-600" : statement.closing_balance < 0 ? "text-red-600" : "text-slate-500")}>
                {currency} {formatCurrency(statement.closing_balance)}
                {statement.closing_balance > 0 && <span className="text-sm font-normal mr-1">عليه</span>}
                {statement.closing_balance < 0 && <span className="text-sm font-normal mr-1">له</span>}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">المستند</th>
                    <th className="px-4 py-3 text-right">البيان</th>
                    <th className="px-4 py-3 text-center">مدين</th>
                    <th className="px-4 py-3 text-center">دائن</th>
                    <th className="px-4 py-3 text-center">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((t, i) => {
                      const bal = getRunningBalance(statement.transactions, i, statement.opening_balance)
                      return (
                        <tr key={i} className="table-row">
                          <td className="px-4 py-3">{t.date}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.doc_number}</td>
                          <td className="px-4 py-3">{t.description}</td>
                          <td className="px-4 py-3 text-center font-medium">{t.debit > 0 ? currency + ' ' + formatCurrency(t.debit) : "-"}</td>
                          <td className="px-4 py-3 text-center font-medium">{t.credit > 0 ? currency + ' ' + formatCurrency(t.credit) : "-"}</td>
                          <td className="px-4 py-3 text-center font-medium">{currency} {formatCurrency(bal)}</td>
                        </tr>
                      )
                    })}
                  {statement.transactions.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">لا توجد معاملات في الفترة المحددة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!statement && !loading && (
        <div className="card p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>اختر العميل والفترة الزمنية ثم اضغط "عرض الكشف"</p>
        </div>
      )}
    </div>
  )
}

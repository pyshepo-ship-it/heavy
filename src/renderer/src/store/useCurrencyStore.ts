import { create } from 'zustand'

interface CurrencyStore {
  currency: string
  vatRate: number
  loaded: boolean
  load: () => Promise<void>
  format: (val: number | null | undefined) => string
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  currency: 'ر.س',
  vatRate: 15,
  loaded: false,
  load: async () => {
    try {
      const s = await window.api.getSettings()
      if (s) {
        set({ currency: s.currency || 'ر.س', vatRate: s.vat_rate ?? 15, loaded: true })
      } else {
        set({ loaded: true })
      }
    } catch {
      set({ loaded: true })
    }
  },
  format: (val) => {
    const { currency } = get()
    const n = Number(val) || 0
    return currency + ' ' + n.toLocaleString('ar-EG')
  }
}))

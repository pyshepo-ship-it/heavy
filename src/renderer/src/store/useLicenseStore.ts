import { create } from 'zustand'
import type { LicenseInfo } from '@shared/types'

interface LicenseStore {
  license: LicenseInfo | null
  isLoading: boolean
  error: string | null
  checkLicense: () => Promise<void>
  activateLicense: (code: string) => Promise<{ success: boolean; message: string }>
  getDeviceId: () => Promise<string>
}

export const useLicenseStore = create<LicenseStore>((set) => ({
  license: null,
  isLoading: true,
  error: null,

  checkLicense: async () => {
    set({ isLoading: true, error: null })
    try {
      const license = await window.api.checkLicense()
      set({ license, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  activateLicense: async (code: string) => {
    try {
      const result = await window.api.activateLicense(code)
      if (result.success) {
        await useLicenseStore.getState().checkLicense()
      }
      return result
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  },

  getDeviceId: async () => {
    return await window.api.getDeviceId()
  }
}))

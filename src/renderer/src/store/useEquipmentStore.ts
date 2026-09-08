import { create } from 'zustand'
import type { Equipment } from '@shared/types'

interface EquipmentStore {
  equipment: Equipment[]
  isLoading: boolean
  fetchEquipment: () => Promise<void>
  addEquipment: (eq: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => Promise<number>
  updateEquipment: (id: number, eq: Partial<Equipment>) => Promise<void>
  deleteEquipment: (id: number) => Promise<void>
}

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  equipment: [],
  isLoading: false,

  fetchEquipment: async () => {
    set({ isLoading: true })
    try {
      const equipment = await window.api.getEquipment()
      set({ equipment, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addEquipment: async (eq) => {
    const id = await window.api.createEquipment(eq)
    await useEquipmentStore.getState().fetchEquipment()
    return id
  },

  updateEquipment: async (id, eq) => {
    await window.api.updateEquipment(id, eq)
    await useEquipmentStore.getState().fetchEquipment()
  },

  deleteEquipment: async (id) => {
    await window.api.deleteEquipment(id)
    await useEquipmentStore.getState().fetchEquipment()
  }
}))

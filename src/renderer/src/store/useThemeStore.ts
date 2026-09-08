import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeStore>((set) => {
  const saved = (localStorage.getItem('theme') as Theme) || 'system'
  const resolved = saved === 'system' ? getSystemTheme() : saved
  applyTheme(resolved)

  return {
    theme: saved,
    resolvedTheme: resolved,
    setTheme: (theme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme
      applyTheme(resolved)
      localStorage.setItem('theme', theme)
      set({ theme, resolvedTheme: resolved })
    }
  }
})

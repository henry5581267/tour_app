export interface Colors {
  background: string
  surface: string
  surfaceSecondary: string
  text: string
  textSecondary: string
  textTertiary: string
  border: string
  tabBar: string
  primary: string
  danger: string
}

export const lightColors: Colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#aaaaaa',
  border: '#e2e8f0',
  tabBar: '#ffffff',
  primary: '#3b82f6',
  danger: '#ef4444',
}

export const darkColors: Colors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#334155',
  tabBar: '#1e293b',
  primary: '#60a5fa',
  danger: '#f87171',
}

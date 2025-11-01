/**
 * Theme management utilities
 * Handles theme application and system preference detection
 */

import type { AppearanceSettings } from '@/types/settings'

let mediaQuery: MediaQueryList | null = null
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null

/**
 * Applies theme to the document based on settings
 * @param theme - Theme setting from appearance settings
 */
export function applyTheme(theme: AppearanceSettings['theme']): void {
  const html = document.documentElement
  
  // Remove existing theme attributes
  html.removeAttribute('data-theme')
  html.classList.remove('dark')
  
  // Apply new theme
  switch (theme) {
    case 'light':
      html.setAttribute('data-theme', 'light')
      break
    case 'dark':
      html.setAttribute('data-theme', 'dark')
      html.classList.add('dark')
      break
    case 'system':
      html.setAttribute('data-theme', 'system')
      applySystemTheme()
      break
  }
}

/**
 * Applies system theme based on OS preference
 */
function applySystemTheme(): void {
  if (typeof window === 'undefined') return
  
  // Clean up existing listener
  if (mediaQuery && mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener)
  }
  
  // Create new media query listener
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryListener = (e: MediaQueryListEvent) => {
    const htmlElement = document.documentElement
    if (e.matches) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }
  
  // Apply initial system theme
  const htmlElement = document.documentElement
  if (mediaQuery.matches) {
    htmlElement.classList.add('dark')
  } else {
    htmlElement.classList.remove('dark')
  }
  
  // Add listener for future changes
  mediaQuery.addEventListener('change', mediaQueryListener)
}

/**
 * Cleanup theme listeners (call on component unmount)
 */
export function cleanupThemeListeners(): void {
  if (mediaQuery && mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener)
    mediaQuery = null
    mediaQueryListener = null
  }
}

/**
 * Get current system theme preference
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Initialize theme from localStorage before React hydration
 * This prevents flash of incorrect theme
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') return
  
  try {
    const settingsJson = localStorage.getItem('app-settings')
    if (settingsJson) {
      const settings = JSON.parse(settingsJson)
      const theme = settings?.appearance?.theme
      if (theme) {
        applyTheme(theme)
      }
    }
  } catch (error) {
    console.error('Failed to initialize theme from localStorage:', error)
  }
}
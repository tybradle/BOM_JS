// Event-based system to trigger header actions from anywhere in the app

type HeaderAction = 'openProjectManager' | 'openDatabaseTools'

class HeaderActionsManager {
  private listeners: Map<HeaderAction, Set<() => void>> = new Map()

  subscribe(action: HeaderAction, callback: () => void) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set())
    }
    this.listeners.get(action)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(action)?.delete(callback)
    }
  }

  trigger(action: HeaderAction) {
    this.listeners.get(action)?.forEach(callback => callback())
  }
}

export const headerActions = new HeaderActionsManager()

// Helper functions for common actions
export const openProjectManager = () => headerActions.trigger('openProjectManager')
export const openDatabaseTools = () => headerActions.trigger('openDatabaseTools')

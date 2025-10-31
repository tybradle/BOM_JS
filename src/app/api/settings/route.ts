import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_SETTINGS, mergeWithDefaults, isValidSettings, type AppSettings } from '@/types/settings'

/**
 * GET /api/settings
 * Fetches user settings from database or returns defaults
 */
export async function GET() {
  try {
    // Get the default user (demo@bom-framework.com)
    // In a real app, this would come from the authenticated session
    let user = await db.user.findFirst({
      where: { email: 'demo@bom-framework.com' },
      include: { settings: true }
    })

    // Create default user if doesn't exist
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@bom-framework.com',
          name: 'Demo User'
        },
        include: { settings: true }
      })
    }

    // Return user settings or defaults
    if (user.settings) {
      const storedSettings = user.settings.settings as unknown
      
      // Validate and merge with defaults to ensure all fields exist
      if (isValidSettings(storedSettings)) {
        return NextResponse.json(mergeWithDefaults(storedSettings))
      }
    }

    // No settings found, return defaults
    return NextResponse.json(DEFAULT_SETTINGS)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings
 * Updates user settings (partial updates supported)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    // Validate that body contains valid settings
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Get the default user
    let user = await db.user.findFirst({
      where: { email: 'demo@bom-framework.com' },
      include: { settings: true }
    })

    // Create user if doesn't exist
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@bom-framework.com',
          name: 'Demo User'
        },
        include: { settings: true }
      })
    }

    // Get existing settings or use defaults
    let currentSettings: AppSettings = DEFAULT_SETTINGS
    if (user.settings) {
      const storedSettings = user.settings.settings as unknown
      if (isValidSettings(storedSettings)) {
        currentSettings = storedSettings
      }
    }

    // Deep merge the updates with current settings
    const updatedSettings = deepMerge(currentSettings, body)

    // Validate merged settings
    const finalSettings = mergeWithDefaults(updatedSettings)

    // Upsert settings
    const savedSettings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        settings: finalSettings as any
      },
      create: {
        userId: user.id,
        settings: finalSettings as any
      }
    })

    return NextResponse.json(finalSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

/**
 * Deep merge utility for settings updates
 * Recursively merges source into target
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        output[key] = source[key]
      }
    })
  }
  
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

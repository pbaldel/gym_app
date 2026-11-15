import { DEFAULT_SETTINGS, type SettingKey, type SettingsMap } from '../../domain/types'
import { db } from '../schema'

/** Ajustes con los valores por defecto para las claves que no se han guardado. */
export async function getSettings(): Promise<SettingsMap> {
  const rows = await db.settings.toArray()
  const settings: SettingsMap = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    if (row.key in settings) (settings as Record<SettingKey, unknown>)[row.key] = row.value
  }
  return settings
}

export async function setSetting<K extends SettingKey>(key: K, value: SettingsMap[K]): Promise<void> {
  await db.settings.put({ key, value })
}

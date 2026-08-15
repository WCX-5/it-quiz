import type { UserConfig, PracticeMode } from '@/types'

const KEYS = {
  config: 'it_quiz_config',
  lastPractice: 'it_quiz_last_practice',
  checkin: 'it_quiz_daily_checkin',
}

const defaultConfig: UserConfig = {
  theme: 'light', fontSize: 16,
  shortcuts: {
    prevQuestion: 'ArrowLeft', nextQuestion: 'ArrowRight', submitAnswer: 'Enter',
    toggleExplanation: 'Space', toggleFavorite: 'KeyF', toggleMemorize: 'KeyM',
    optionA: 'Digit1', optionB: 'Digit2', optionC: 'Digit3', optionD: 'Digit4',
  },
  lastPosition: null,
}

function lsGet<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* noop */ }
}

export const getConfig = (): UserConfig => ({ ...defaultConfig, ...lsGet(KEYS.config, defaultConfig) })
export const saveConfig = (c: UserConfig) => lsSet(KEYS.config, c)

export interface LastPractice { mode: PracticeMode; questionId: number; index: number; timestamp: number }
export const getLastPractice = () => lsGet<LastPractice | null>(KEYS.lastPractice, null)
export const saveLastPractice = (p: LastPractice) => lsSet(KEYS.lastPractice, p)

export const getCheckInRecords = () => lsGet<string[]>(KEYS.checkin, [])
export function addCheckIn(date: string) {
  const records = getCheckInRecords()
  if (!records.includes(date)) { records.push(date); lsSet(KEYS.checkin, records) }
}

export function getStreakDays(): number {
  const records = getCheckInRecords()
  if (!records.length) return 0
  const sorted = [...records].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    if ((new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000 === 1) streak++
    else break
  }
  return streak
}

export const exportAllData = () => JSON.stringify({
  config: getConfig(), lastPractice: getLastPractice(), checkins: getCheckInRecords(),
  exportTime: new Date().toISOString(), version: '1.0',
}, null, 2)

export const clearAllLocalData = () => Object.values(KEYS).forEach(k => localStorage.removeItem(k))

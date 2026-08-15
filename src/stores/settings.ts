import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getConfig, saveConfig } from '@/utils/storage'
import type { UserConfig } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const config = ref<UserConfig>(getConfig())
  const theme = computed(() => config.value.theme)
  const fontSize = computed(() => config.value.fontSize)
  const shortcuts = computed(() => config.value.shortcuts)

  const persist = () => saveConfig(config.value)
  const applyTheme = (t: 'light' | 'dark') => document.documentElement.classList.toggle('dark', t === 'dark')
  const applyFontSize = (s: number) => document.documentElement.style.fontSize = `${s}px`

  function setTheme(t: 'light' | 'dark') { config.value.theme = t; applyTheme(t); persist() }
  function toggleTheme() { setTheme(config.value.theme === 'light' ? 'dark' : 'light') }
  function setFontSize(s: number) { config.value.fontSize = s; applyFontSize(s); persist() }
  function updateShortcut(action: string, key: string) { config.value.shortcuts[action] = key; persist() }
  function resetShortcuts() {
    config.value.shortcuts = {
      prevQuestion: 'ArrowLeft', nextQuestion: 'ArrowRight', submitAnswer: 'Enter',
      toggleExplanation: 'Space', toggleFavorite: 'KeyF', toggleMemorize: 'KeyM',
      optionA: 'Digit1', optionB: 'Digit2', optionC: 'Digit3', optionD: 'Digit4',
    }
    persist()
  }
  function initTheme() { applyTheme(config.value.theme); applyFontSize(config.value.fontSize) }

  return { config, theme, fontSize, shortcuts, setTheme, toggleTheme, setFontSize, updateShortcut, resetShortcuts, initTheme }
})

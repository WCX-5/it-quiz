import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyStat, Note } from '@/types'
import { getDailyStats, getPracticeRecordsCount, getWrongQuestionsCount, getFavoritesCount, getQuestionsCount, getNote, saveNote } from '@/composables/useIndexedDB'
import { getStreakDays, getCheckInRecords } from '@/utils/storage'

export const useStatsStore = defineStore('stats', () => {
  const dailyStats = ref<DailyStat[]>([])
  const totalQuestions = ref(0)
  const practicedCount = ref(0)
  const wrongCount = ref(0)
  const favoriteCount = ref(0)
  const streakDays = ref(0)
  const checkInRecords = ref<string[]>([])
  const loading = ref(false)

  const correctRate = computed(() => {
    const total = dailyStats.value.reduce((s, d) => s + d.totalCount, 0)
    const correct = dailyStats.value.reduce((s, d) => s + d.correctCount, 0)
    return total > 0 ? Math.round((correct / total) * 100) : 0
  })

  const todayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return dailyStats.value.find(s => s.date === today)?.totalCount || 0
  })

  async function loadStats() {
    loading.value = true
    try {
      dailyStats.value = await getDailyStats()
      totalQuestions.value = await getQuestionsCount()
      practicedCount.value = await getPracticeRecordsCount()
      wrongCount.value = await getWrongQuestionsCount()
      favoriteCount.value = await getFavoritesCount()
      streakDays.value = getStreakDays()
      checkInRecords.value = getCheckInRecords()
    } finally { loading.value = false }
  }

  const getNoteByQuestion = (qid: number) => getNote(qid)
  const saveNoteForQuestion = (qid: number, content: string) => saveNote({ questionId: qid, content, updated_at: Date.now() })

  function getLastNDaysStats(n: number): DailyStat[] {
    const result: DailyStat[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.push(dailyStats.value.find(s => s.date === dateStr) || { date: dateStr, totalCount: 0, correctCount: 0, timeSpent: 0 })
    }
    return result
  }

  function generateCalendarHeatmap(year: number, month: number): (DailyStat | null)[][] {
    const startDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const weeks: (DailyStat | null)[][] = []
    let week: (DailyStat | null)[] = Array(startDay).fill(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      week.push(dailyStats.value.find(s => s.date === dateStr) || null)
      if (week.length === 7) { weeks.push(week); week = [] }
    }
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week) }
    return weeks
  }

  return { dailyStats, totalQuestions, practicedCount, wrongCount, favoriteCount, streakDays, checkInRecords, loading, correctRate, todayCount, loadStats, getNoteByQuestion, saveNoteForQuestion, getLastNDaysStats, generateCalendarHeatmap }
})

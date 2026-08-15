import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, PracticeMode } from '@/types'
import { getQuestion, addPracticeRecord, addWrongQuestion, removeWrongQuestion, addFavorite, removeFavorite, isFavorite, saveDailyStat, getDailyStat } from '@/composables/useIndexedDB'
import { saveLastPractice, addCheckIn } from '@/utils/storage'
import { useQuestionStore } from './question'
import { isAnswerCorrect } from '@/utils/constants'

interface PState {
  mode: PracticeMode; questionList: number[]; currentIndex: number
  showExplanation: boolean; userAnswer: string | string[]; isSubmitted: boolean
  isCorrect: boolean; memorizeMode: boolean; startTime: number
  categoryFilter?: string; tagFilter?: string; difficultyFilter?: number
}

export const usePracticeStore = defineStore('practice', () => {
  const state = ref<PState>({ mode: 'sequential', questionList: [], currentIndex: 0, showExplanation: false, userAnswer: '', isSubmitted: false, isCorrect: false, memorizeMode: false, startTime: Date.now() })
  const currentQuestion = ref<Question | null>(null)
  const isFavorited = ref(false)
  const loading = ref(false)

  const totalQuestions = computed(() => state.value.questionList.length)
  const currentQuestionId = computed(() => state.value.questionList[state.value.currentIndex] || null)
  const progress = computed(() => totalQuestions.value === 0 ? 0 : ((state.value.currentIndex + 1) / totalQuestions.value) * 100)
  const hasPrev = computed(() => state.value.currentIndex > 0)
  const hasNext = computed(() => state.value.currentIndex < totalQuestions.value - 1)

  async function startPractice(mode: PracticeMode, filters?: { bankId?: number; bankIds?: number[]; questionTypes?: string[]; category?: string }) {
    const qs = useQuestionStore()
    state.value = { ...state.value, mode, currentIndex: 0, showExplanation: false, userAnswer: '', isSubmitted: false, isCorrect: false, startTime: Date.now() }
    let ids: number[] = []

    if (mode === 'random') ids = await qs.getRandomQuestions(50)
    else if (mode === 'wrong') ids = await qs.getWrongQuestionIds(filters?.bankId)
    else if (mode === 'favorite') ids = await qs.getFavoriteQuestionIds(filters?.bankId)
    else if (mode === 'category') {
      if (filters?.bankIds?.length) { for (const bid of filters.bankIds) ids.push(...await qs.getQuestionIdsByBank(bid)) }
      else if (filters?.category) ids = await qs.getQuestionsByCategory(filters.category, filters?.bankId)
      else ids = await qs.getAllIds()
    } else { // sequential
      if (filters?.bankIds?.length) { for (const bid of filters.bankIds) { const orig = qs.filterBankId; qs.filterBankId = bid; ids.push(...await qs.getAllIds()); qs.filterBankId = orig } }
      else if (filters?.bankId !== undefined) { const orig = qs.filterBankId; qs.filterBankId = filters.bankId; ids = await qs.getAllIds(); qs.filterBankId = orig }
      else ids = await qs.getAllIds()
    }

    if (filters?.questionTypes?.length) {
      const filtered: number[] = []
      for (const id of ids) { const q = await qs.getQuestionById(id); if (q && filters.questionTypes.includes(q.type)) filtered.push(id) }
      ids = filtered
    }
    if (mode === 'random') ids = ids.sort(() => Math.random() - 0.5)

    state.value.questionList = ids
    if (ids.length) await loadCurrentQuestion()
  }

  async function loadCurrentQuestion() {
    const id = currentQuestionId.value
    if (!id) { currentQuestion.value = null; return }
    loading.value = true
    try {
      currentQuestion.value = (await getQuestion(id)) || null
      isFavorited.value = await isFavorite(id)
      state.value.showExplanation = state.value.memorizeMode
      state.value.userAnswer = ''; state.value.isSubmitted = false; state.value.isCorrect = false
      saveLastPractice({ mode: state.value.mode, questionId: id, index: state.value.currentIndex, timestamp: Date.now() })
    } finally { loading.value = false }
  }

  function selectOption(index: number) {
    if (state.value.isSubmitted || !currentQuestion.value) return
    const type = currentQuestion.value.type
    if (type === 'single' || type === 'judge') state.value.userAnswer = String.fromCharCode(65 + index)
    else if (type === 'multiple') {
      const cur = (state.value.userAnswer as string) || ''
      const opt = String.fromCharCode(65 + index)
      state.value.userAnswer = cur.includes(opt) ? cur.replace(opt, '').split('').sort().join('') : (cur + opt).split('').sort().join('')
    }
  }
  const setShortAnswer = (t: string) => { if (!state.value.isSubmitted) state.value.userAnswer = t }
  const setCodeAnswer = (c: string) => { if (!state.value.isSubmitted) state.value.userAnswer = c }

  function submitAnswer() {
    if (!currentQuestion.value || state.value.isSubmitted) return
    const q = currentQuestion.value
    const correct = isAnswerCorrect(q.type, state.value.userAnswer, q.answer)
    state.value.isCorrect = correct; state.value.isSubmitted = true; state.value.showExplanation = true
    const timeSpent = Date.now() - state.value.startTime
    addPracticeRecord({ questionId: q.id!, isCorrect: correct, userAnswer: state.value.userAnswer, timeSpent, timestamp: Date.now() })
    if (!correct) addWrongQuestion({ questionId: q.id!, wrongCount: 1, lastWrongAnswer: state.value.userAnswer, lastWrongTime: Date.now() })
    else if (q.type !== 'program') removeWrongQuestion(q.id!)
    updateDailyStats(correct)
    return correct
  }

  async function updateDailyStats(isCorrect: boolean) {
    const today = new Date().toISOString().split('T')[0]
    const stat = (await getDailyStat(today)) || { date: today, totalCount: 0, correctCount: 0, timeSpent: 0 }
    stat.totalCount++; if (isCorrect) stat.correctCount++
    await saveDailyStat(stat); addCheckIn(today)
  }

  const prevQuestion = () => hasPrev.value ? (state.value.currentIndex--, loadCurrentQuestion()) : undefined
  const nextQuestion = () => hasNext.value ? (state.value.currentIndex++, loadCurrentQuestion()) : undefined
  const jumpTo = (i: number) => { if (i >= 0 && i < totalQuestions.value) { state.value.currentIndex = i; loadCurrentQuestion() } }
  const toggleExplanation = () => state.value.showExplanation = !state.value.showExplanation
  function toggleMemorizeMode() { state.value.memorizeMode = !state.value.memorizeMode; if (state.value.memorizeMode) state.value.showExplanation = true }

  async function toggleFavorite() {
    const id = currentQuestionId.value; if (!id) return
    if (isFavorited.value) { await removeFavorite(id); isFavorited.value = false }
    else { await addFavorite({ questionId: id, timestamp: Date.now() }); isFavorited.value = true }
  }

  function resetPractice() {
    state.value = { ...state.value, questionList: [], currentIndex: 0, showExplanation: false, userAnswer: '', isSubmitted: false, isCorrect: false }
    currentQuestion.value = null; isFavorited.value = false
  }

  return { state, currentQuestion, isFavorited, loading, totalQuestions, currentQuestionId, progress, hasPrev, hasNext, startPractice, loadCurrentQuestion, selectOption, setShortAnswer, setCodeAnswer, submitAnswer, prevQuestion, nextQuestion, jumpTo, toggleExplanation, toggleMemorizeMode, toggleFavorite, resetPractice }
})

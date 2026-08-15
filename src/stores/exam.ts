import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExamConfig, Question } from '@/types'
import { getQuestion, addWrongQuestion, addPracticeRecord } from '@/composables/useIndexedDB'
import { useQuestionStore } from './question'
import { isAnswerCorrect } from '@/utils/constants'

interface EState {
  config: ExamConfig | null; questionIds: number[]; answers: Record<number, string | string[]>
  startTime: number; endTime: number | null; currentIndex: number; isFinished: boolean; score: number
}

export const useExamStore = defineStore('exam', () => {
  const state = ref<EState>({ config: null, questionIds: [], answers: {}, startTime: 0, endTime: null, currentIndex: 0, isFinished: false, score: 0 })
  const currentQuestion = ref<Question | null>(null)
  const loading = ref(false)
  const timerInterval = ref<number | null>(null)
  const remainingTime = ref(0)

  const totalQuestions = computed(() => state.value.questionIds.length)
  const answeredCount = computed(() => Object.keys(state.value.answers).length)
  const progress = computed(() => totalQuestions.value === 0 ? 0 : (answeredCount.value / totalQuestions.value) * 100)
  const hasPrev = computed(() => state.value.currentIndex > 0)
  const hasNext = computed(() => state.value.currentIndex < totalQuestions.value - 1)
  const isTimeUp = computed(() => remainingTime.value <= 0)
  const formattedTime = computed(() => {
    const m = Math.floor(remainingTime.value / 60), s = remainingTime.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  async function startExam(config: ExamConfig) {
    const qs = useQuestionStore()
    state.value = { config, answers: {}, startTime: Date.now(), endTime: null, currentIndex: 0, isFinished: false, score: 0, questionIds: [] }
    const allIds = await qs.getAllIds()
    const all = (await Promise.all(allIds.map(getQuestion))).filter(Boolean) as Question[]
    let filtered = all
    if (config.types.length) filtered = filtered.filter(q => config.types.includes(q.type))
    if (config.bankIds.length) filtered = filtered.filter(q => q.bankId !== undefined && config.bankIds.includes(q.bankId))
    filtered = filtered.filter(q => q.difficulty >= config.difficultyRange[0] && q.difficulty <= config.difficultyRange[1])
    state.value.questionIds = filtered.sort(() => Math.random() - 0.5).slice(0, Math.min(config.questionCount, filtered.length)).map(q => q.id!).filter(Boolean) as number[]
    remainingTime.value = config.duration * 60
    if (state.value.questionIds.length) await loadCurrentQuestion()
    startTimer()
    return state.value.questionIds.length
  }

  function startTimer() {
    if (timerInterval.value) clearInterval(timerInterval.value)
    timerInterval.value = window.setInterval(() => { if (remainingTime.value > 0) remainingTime.value--; else finishExam() }, 1000)
  }
  function stopTimer() { if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null } }

  async function loadCurrentQuestion() {
    const id = state.value.questionIds[state.value.currentIndex]
    if (!id) { currentQuestion.value = null; return }
    loading.value = true
    try { currentQuestion.value = (await getQuestion(id)) || null } finally { loading.value = false }
  }

  const setAnswer = (qid: number, answer: string | string[]) => { state.value.answers[qid] = answer }
  function getCurrentAnswer() { const id = state.value.questionIds[state.value.currentIndex]; return state.value.answers[id] || '' }

  const prevQuestion = () => hasPrev.value ? (state.value.currentIndex--, loadCurrentQuestion()) : undefined
  const nextQuestion = () => hasNext.value ? (state.value.currentIndex++, loadCurrentQuestion()) : undefined
  const jumpTo = (i: number) => { if (i >= 0 && i < totalQuestions.value) { state.value.currentIndex = i; loadCurrentQuestion() } }

  async function finishExam() {
    stopTimer()
    state.value.endTime = Date.now(); state.value.isFinished = true
    let correctCount = 0
    const wrongs: { id: number; answer: string | string[] }[] = []
    for (const qid of state.value.questionIds) {
      const q = await getQuestion(qid)
      const userAns = state.value.answers[qid]
      if (!q || !userAns) continue
      const correct = isAnswerCorrect(q.type, userAns, q.answer)
      if (correct) correctCount++; else wrongs.push({ id: qid, answer: userAns })
      addPracticeRecord({ questionId: qid, isCorrect: correct, userAnswer: userAns, timeSpent: 0, timestamp: Date.now() })
    }
    state.value.score = totalQuestions.value > 0 ? Math.round((correctCount / totalQuestions.value) * 100) : 0
    for (const w of wrongs) addWrongQuestion({ questionId: w.id, wrongCount: 1, lastWrongAnswer: w.answer, lastWrongTime: Date.now() })
    return { score: state.value.score, correctCount, total: totalQuestions.value, wrongCount: wrongs.length }
  }

  function resetExam() {
    stopTimer()
    state.value = { config: null, questionIds: [], answers: {}, startTime: 0, endTime: null, currentIndex: 0, isFinished: false, score: 0 }
    currentQuestion.value = null; remainingTime.value = 0
  }

  return { state, currentQuestion, loading, remainingTime, formattedTime, totalQuestions, answeredCount, progress, hasPrev, hasNext, isTimeUp, startExam, loadCurrentQuestion, setAnswer, getCurrentAnswer, prevQuestion, nextQuestion, jumpTo, finishExam, resetExam }
})

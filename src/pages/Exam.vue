<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, ChevronLeft, ChevronRight, List, X, FileText, Home } from 'lucide-vue-next'
import { useExamStore } from '@/stores/exam'
import { useQuestionStore } from '@/stores/question'
import { useSettingsStore } from '@/stores/settings'
import OptionList from '@/components/question/OptionList.vue'
import CodeEditor from '@/components/question/CodeEditor.vue'
import { typeNameMap, questionTypes, typeTagClass, isCorrectOption, isAnswerCorrect, formatAnswer as fmtAns, hasUserAnswer } from '@/utils/constants'
import type { QuestionType, ExamConfig, Question } from '@/types'

const router = useRouter()
const examStore = useExamStore()
const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()

const showConfig = ref(true)
const showAnswerSheet = ref(false)
const showResult = ref(false)
const showReview = ref(false)

const config = ref<ExamConfig>({ questionCount: 20, duration: 30, types: [], bankIds: [], difficultyRange: [1, 5] })
const shortAnswer = ref('')
const codeAnswer = ref('')

const examResult = ref<{
  score: number; correctCount: number; wrongCount: number; unansweredCount: number; total: number
  questionResults: Array<{ question: Question; userAnswer: string | string[]; isCorrect: boolean }>
} | null>(null)

const resultStats = computed(() => examResult.value ? {
  score: examResult.value.score, total: examResult.value.total, correct: examResult.value.correctCount,
  wrong: examResult.value.wrongCount, unanswered: examResult.value.unansweredCount,
} : null)

const timeWarning = computed(() => examStore.remainingTime < 300)

function toggleArr<T>(arr: T[], val: T) {
  const idx = arr.indexOf(val)
  idx > -1 ? arr.splice(idx, 1) : arr.push(val)
}

async function startExam() {
  const count = await examStore.startExam(config.value)
  if (count === 0) { alert('没有符合条件的题目，请调整筛选条件'); return }
  showConfig.value = false
  shortAnswer.value = ''
  codeAnswer.value = ''
}

function handleOptionSelect(index: number) {
  if (!examStore.currentQuestion) return
  const type = examStore.currentQuestion.type
  let answer = ''
  if (type === 'single' || type === 'judge') answer = String.fromCharCode(65 + index)
  else if (type === 'multiple') {
    const cur = (examStore.getCurrentAnswer() as string) || ''
    const opt = String.fromCharCode(65 + index)
    answer = cur.includes(opt) ? cur.replace(opt, '').split('').sort().join('') : (cur + opt).split('').sort().join('')
  } else return
  examStore.setAnswer(examStore.currentQuestion.id!, answer)
}

const setShort = () => examStore.currentQuestion && examStore.setAnswer(examStore.currentQuestion.id!, shortAnswer.value)
const setCode = () => examStore.currentQuestion && examStore.setAnswer(examStore.currentQuestion.id!, codeAnswer.value)

async function go(action: 'prev' | 'next' | 'jump', idx?: number) {
  if (action === 'prev') await examStore.prevQuestion()
  else if (action === 'next') await examStore.nextQuestion()
  else if (action === 'jump' && idx !== undefined) { await examStore.jumpTo(idx); showAnswerSheet.value = false }
  loadCurrentAnswers()
}

function loadCurrentAnswers() {
  if (!examStore.currentQuestion) return
  const type = examStore.currentQuestion.type
  const answer = examStore.getCurrentAnswer()
  if (type === 'short') shortAnswer.value = (answer as string) || ''
  else if (type === 'program') codeAnswer.value = (answer as string) || examStore.currentQuestion.codeTemplate || ''
}

async function calculateResult() {
  const questionResults: Array<{ question: Question; userAnswer: string | string[]; isCorrect: boolean }> = []
  let correctCount = 0, wrongCount = 0, unansweredCount = 0
  for (const qid of examStore.state.questionIds) {
    const q = await questionStore.getQuestionById(qid)
    if (!q) continue
    const userAns = examStore.state.answers[qid] || ''
    const answered = hasUserAnswer(userAns)
    const isCorrect = answered && isAnswerCorrect(q.type, userAns, q.answer)
    if (!answered) unansweredCount++
    else if (isCorrect) correctCount++
    else wrongCount++
    questionResults.push({ question: q, userAnswer: userAns, isCorrect })
  }
  const total = examStore.state.questionIds.length
  examResult.value = {
    score: total > 0 ? Math.round((correctCount / total) * 100) : 0,
    correctCount, wrongCount, unansweredCount, total, questionResults,
  }
}

async function submitExam() {
  if (confirm('确定要交卷吗？')) {
    examStore.finishExam()
    await calculateResult()
    showResult.value = true
  }
}

const backHome = () => { examStore.resetExam(); router.push('/') }
const restartExam = () => { examStore.resetExam(); showResult.value = false; showConfig.value = true }
const isQuestionAnswered = (index: number) => !!examStore.state.answers[examStore.state.questionIds[index]]

const resultTagClass = (r: { isCorrect: boolean; userAnswer: string | string[] }) =>
  r.isCorrect ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
  : hasUserAnswer(r.userAnswer) ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'

const resultLabel = (r: { isCorrect: boolean; userAnswer: string | string[] }) =>
  r.isCorrect ? '正确' : (hasUserAnswer(r.userAnswer) ? '错误' : '未作答')

const isUserWrongOption = (q: Question, userAns: string | string[], optIdx: number, isCorrect: boolean) => {
  if (isCorrect) return false
  const u = userAns as string
  if (!u || !u.trim()) return false
  return u.toUpperCase().includes(String.fromCharCode(65 + optIdx)) && !isCorrectOption(q, optIdx)
}

onMounted(() => { questionStore.loadBanks() })
onUnmounted(() => { examStore.resetExam() })

watch(() => examStore.isTimeUp, (isUp) => {
  if (isUp && !showResult.value && !showConfig.value) { examStore.finishExam(); showResult.value = true }
})
</script>

<template>
  <div class="max-w-4xl mx-auto animate-fade-in">
    <div v-if="showConfig" class="space-y-6">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white mb-4">
          <FileText class="w-8 h-8" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">模拟考试</h1>
        <p class="text-zinc-500 dark:text-zinc-400">设置考试参数，检验你的学习成果</p>
      </div>

      <div class="card p-5 md:p-6 space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题目数量</label>
            <input v-model.number="config.questionCount" type="number" min="1" max="200" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">考试时长 (分钟)</label>
            <input v-model.number="config.duration" type="number" min="1" max="180" class="input" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题型选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in questionTypes"
              :key="t.value"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              :class="config.types.includes(t.value as QuestionType) ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'"
              @click="toggleArr(config.types, t.value)"
            >
              {{ t.label }}
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-2">不选则包含全部题型</p>
        </div>

        <div v-if="questionStore.banks.length > 0">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题库选择</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="bank in questionStore.banks"
              :key="bank.id"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="config.bankIds.includes(bank.id!) ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'"
              @click="toggleArr(config.bankIds, bank.id!)"
            >
              {{ bank.name }}
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-2">不选则包含全部题库</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            难度范围：{{ config.difficultyRange[0] }} - {{ config.difficultyRange[1] }}
          </label>
          <div class="flex items-center gap-4">
            <input v-model.number="config.difficultyRange[0]" type="range" min="1" max="5" class="flex-1" />
            <input v-model.number="config.difficultyRange[1]" type="range" min="1" max="5" class="flex-1" />
          </div>
        </div>

        <button class="w-full btn-primary text-lg py-3" @click="startExam">开始考试</button>
      </div>
    </div>

    <div v-else-if="showResult && resultStats" class="space-y-6">
      <div class="card p-8 text-center">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold mb-4">
          {{ resultStats.score }}
        </div>
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">考试结束</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-6">满分 100 分，你的得分</p>

        <div class="grid grid-cols-4 gap-3 max-w-lg mx-auto mb-6">
          <div class="bg-zinc-50 dark:bg-zinc-700/50 rounded-xl p-3">
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ resultStats.total }}</div>
            <div class="text-xs text-zinc-500">总题数</div>
          </div>
          <div class="bg-success-50 dark:bg-success-900/20 rounded-xl p-3">
            <div class="text-xl font-bold text-success-600">{{ resultStats.correct }}</div>
            <div class="text-xs text-success-600">答对</div>
          </div>
          <div class="bg-danger-50 dark:bg-danger-900/20 rounded-xl p-3">
            <div class="text-xl font-bold text-danger-600">{{ resultStats.wrong }}</div>
            <div class="text-xs text-danger-600">答错</div>
          </div>
          <div class="bg-zinc-100 dark:bg-zinc-700 rounded-xl p-3">
            <div class="text-xl font-bold text-zinc-500 dark:text-zinc-400">{{ resultStats.unanswered }}</div>
            <div class="text-xs text-zinc-500">未答</div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button class="btn-primary" @click="showReview = true">
            <FileText class="w-4 h-4" />
            查看答卷
          </button>
          <button class="btn-secondary" @click="restartExam">再考一次</button>
          <button class="btn-secondary" @click="backHome">
            <Home class="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="sticky top-16 z-10 bg-zinc-50 dark:bg-zinc-900 pt-2 pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-semibold"
              :class="timeWarning ? 'bg-danger-50 text-danger-600 dark:bg-danger-900/20' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'"
            >
              <Clock class="w-5 h-5" />
              {{ examStore.formattedTime }}
            </div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-zinc-900 dark:text-white">{{ examStore.state.currentIndex + 1 }} / {{ examStore.totalQuestions }}</div>
            <div class="text-xs text-zinc-500">已答 {{ examStore.answeredCount }} 题</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary" @click="showAnswerSheet = true">
              <List class="w-4 h-4" />
              <span class="hidden sm:inline">答题卡</span>
            </button>
            <button class="btn-primary" @click="submitExam">交卷</button>
          </div>
        </div>
      </div>

      <div v-if="examStore.loading" class="card p-12 text-center">
        <div class="animate-pulse text-zinc-500">加载中...</div>
      </div>
      <div v-else-if="!examStore.currentQuestion" class="card p-12 text-center">
        <div class="text-zinc-500">暂无题目</div>
      </div>
      <div v-else class="space-y-4">
        <div class="card p-5 md:p-6">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeTagClass[examStore.currentQuestion.type]">
              {{ typeNameMap[examStore.currentQuestion.type] }}
            </span>
            <span class="text-amber-500 text-sm">{{ '★'.repeat(examStore.currentQuestion.difficulty) }}{{ '☆'.repeat(5 - examStore.currentQuestion.difficulty) }}</span>
          </div>

          <div class="text-lg font-medium text-zinc-900 dark:text-white mb-6 leading-relaxed">
            {{ examStore.currentQuestion.content }}
          </div>

          <OptionList
            v-if="['single', 'multiple', 'judge'].includes(examStore.currentQuestion.type)"
            :options="examStore.currentQuestion.options"
            :type="examStore.currentQuestion.type"
            :user-answer="(examStore.getCurrentAnswer() as string) || ''"
            :correct-answer="examStore.currentQuestion.answer"
            :is-submitted="false"
            @select="handleOptionSelect"
          />

          <div v-else-if="examStore.currentQuestion.type === 'short'" class="space-y-3">
            <textarea v-model="shortAnswer" class="input min-h-[120px] resize-y" placeholder="请输入你的答案..." @input="setShort" />
          </div>

          <div v-else-if="examStore.currentQuestion.type === 'program'" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-500 dark:text-zinc-400">
                语言：{{ examStore.currentQuestion.language || 'javascript' }}
              </span>
            </div>
            <div class="min-h-[300px]">
              <CodeEditor
                v-model="codeAnswer"
                :language="examStore.currentQuestion.language || 'javascript'"
                :theme="settingsStore.theme"
                @update:model-value="setCode"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <button class="btn-secondary" :disabled="!examStore.hasPrev" @click="go('prev')">
            <ChevronLeft class="w-4 h-4" />
            上一题
          </button>
          <button class="btn-primary flex-1 sm:flex-none" :disabled="!examStore.hasNext" @click="go('next')">
            下一题
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showReview" class="fixed inset-0 bg-black/50 z-50" @click.self="showReview = false" />
      </Transition>

      <Transition name="slide-up">
        <div v-if="showReview && examResult" class="fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-zinc-800 z-50 shadow-xl flex flex-col rounded-t-2xl">
          <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 class="font-semibold text-zinc-900 dark:text-white text-lg">考试答卷详情</h3>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-4 text-sm">
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-success-500"></span>正确 {{ examResult.correctCount }}</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-danger-500"></span>错误 {{ examResult.wrongCount }}</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-zinc-300"></span>未答 {{ examResult.unansweredCount }}</span>
              </div>
              <button class="btn-ghost p-2 -mr-2" @click="showReview = false">
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            <div
              v-for="(result, idx) in examResult.questionResults"
              :key="result.question.id"
              class="card p-4 border-l-4"
              :class="result.isCorrect ? 'border-l-success-500' : (hasUserAnswer(result.userAnswer) ? 'border-l-danger-500' : 'border-l-zinc-300')"
            >
              <div class="flex items-start justify-between mb-3 gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-zinc-500 dark:text-zinc-400">第 {{ idx + 1 }} 题</span>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeTagClass[result.question.type]">
                    {{ typeNameMap[result.question.type] }}
                  </span>
                </div>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="resultTagClass(result)">
                  {{ resultLabel(result) }}
                </span>
              </div>

              <div class="text-zinc-800 dark:text-zinc-100 font-medium mb-3 leading-relaxed">
                {{ result.question.content }}
              </div>

              <div v-if="['single', 'multiple', 'judge'].includes(result.question.type)" class="space-y-2 mb-3">
                <div
                  v-for="(opt, optIdx) in result.question.options"
                  :key="optIdx"
                  class="p-3 rounded-lg text-sm"
                  :class="{
                    'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800': isCorrectOption(result.question, optIdx),
                    'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800': isUserWrongOption(result.question, result.userAnswer as string, optIdx, result.isCorrect),
                    'bg-zinc-50 dark:bg-zinc-700/50': !isCorrectOption(result.question, optIdx) && !isUserWrongOption(result.question, result.userAnswer as string, optIdx, result.isCorrect),
                  }"
                >
                  <span class="font-medium mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                  {{ opt }}
                </div>
              </div>

              <div v-else-if="result.question.type === 'short'" class="space-y-2 mb-3">
                <div class="p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg text-sm">
                  <span class="text-zinc-500 dark:text-zinc-400 font-medium">你的答案：</span>
                  <span :class="result.isCorrect ? 'text-success-600' : 'text-danger-600'">
                    {{ (result.userAnswer as string) || '(未作答)' }}
                  </span>
                </div>
              </div>

              <div v-else-if="result.question.type === 'program'" class="space-y-2 mb-3">
                <div class="p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                  <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">你的答案：</div>
                  <pre class="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">{{ (result.userAnswer as string) || '(未作答)' }}</pre>
                </div>
              </div>

              <div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm">
                <div class="font-medium text-primary-700 dark:text-primary-300 mb-1">
                  正确答案：<span class="font-normal text-primary-600 dark:text-primary-400">{{ fmtAns(result.question) }}</span>
                </div>
                <div v-if="result.question.explanation" class="text-zinc-600 dark:text-zinc-300 text-xs mt-2 pt-2 border-t border-primary-100 dark:border-primary-800">
                  <span class="font-medium">解析：</span>{{ result.question.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="showAnswerSheet" class="fixed inset-0 bg-black/50 z-50" @click="showAnswerSheet = false" />
      </Transition>

      <Transition name="slide-right">
        <div v-if="showAnswerSheet" class="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-800 z-50 shadow-xl flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 class="font-semibold text-zinc-900 dark:text-white">答题卡</h3>
            <button class="btn-ghost p-2 -mr-2" @click="showAnswerSheet = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-primary-500"></div><span class="text-zinc-600 dark:text-zinc-300">当前</span></div>
              <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-success-500"></div><span class="text-zinc-600 dark:text-zinc-300">已答</span></div>
              <div class="flex items-center gap-2"><div class="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700"></div><span class="text-zinc-600 dark:text-zinc-300">未答</span></div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="(_, idx) in examStore.state.questionIds"
                :key="idx"
                class="aspect-square rounded-lg text-sm font-medium transition-all"
                :class="{
                  'bg-primary-500 text-white ring-2 ring-primary-300 ring-offset-2 dark:ring-offset-zinc-800': idx === examStore.state.currentIndex,
                  'bg-success-500 text-white': idx !== examStore.state.currentIndex && isQuestionAnswered(idx),
                  'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600': idx !== examStore.state.currentIndex && !isQuestionAnswered(idx),
                }"
                @click="go('jump', idx)"
              >
                {{ idx + 1 }}
              </button>
            </div>
          </div>

          <div class="p-4 border-t border-zinc-200 dark:border-zinc-700">
            <button class="w-full btn-primary" @click="submitExam">
              交卷 ({{ examStore.answeredCount }}/{{ examStore.totalQuestions }})
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>

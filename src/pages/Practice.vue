<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Star, BookOpen, Eye, EyeOff, Check, List, X } from 'lucide-vue-next'
import { usePracticeStore } from '@/stores/practice'
import { useQuestionStore } from '@/stores/question'
import { useSettingsStore } from '@/stores/settings'
import OptionList from '@/components/question/OptionList.vue'
import ExplanationPanel from '@/components/question/ExplanationPanel.vue'
import CodeEditor from '@/components/question/CodeEditor.vue'
import { typeNameMap, questionTypes } from '@/utils/constants'
import type { PracticeMode } from '@/types'

const route = useRoute()
const practiceStore = usePracticeStore()
const questionStore = useQuestionStore()
const settingsStore = useSettingsStore()

const showModeSelector = ref(true)
const showQuestionList = ref(false)
const shortAnswer = ref('')
const codeAnswer = ref('')
const selectedBankIds = ref<number[]>([])
const selectedTypes = ref<string[]>([])

const modeList = [
  { key: 'sequential' as PracticeMode, name: '顺序刷题', desc: '按题库顺序依次练习', color: 'from-blue-500 to-blue-600' },
  { key: 'random' as PracticeMode, name: '随机刷题', desc: '从全题库随机抽取', color: 'from-green-500 to-green-600' },
  { key: 'wrong' as PracticeMode, name: '错题重刷', desc: '针对性练习错题', color: 'from-red-500 to-red-600' },
  { key: 'favorite' as PracticeMode, name: '收藏刷题', desc: '练习收藏的题目', color: 'from-amber-500 to-amber-600' },
]

const modeName = (m: PracticeMode) => modeList.find(x => x.key === m)?.name || '刷题'

const toggleArr = <T,>(arr: T[], val: T) => {
  const idx = arr.indexOf(val)
  idx > -1 ? arr.splice(idx, 1) : arr.push(val)
}

async function startMode(mode: PracticeMode) {
  showModeSelector.value = false
  const filters: { bankIds?: number[]; questionTypes?: string[] } = {}
  if (selectedBankIds.value.length) filters.bankIds = selectedBankIds.value
  if (selectedTypes.value.length) filters.questionTypes = selectedTypes.value
  await practiceStore.startPractice(mode, filters)
  resetAnswerState()
}

const backToModeSelect = () => { showModeSelector.value = true; practiceStore.resetPractice() }

function handleSubmit() {
  if (practiceStore.currentQuestion?.type === 'short') practiceStore.setShortAnswer(shortAnswer.value)
  else if (practiceStore.currentQuestion?.type === 'program') practiceStore.setCodeAnswer(codeAnswer.value)
  practiceStore.submitAnswer()
}

async function go(action: 'prev' | 'next' | 'jump', idx?: number) {
  if (action === 'prev') await practiceStore.prevQuestion()
  else if (action === 'next') await practiceStore.nextQuestion()
  else if (action === 'jump' && idx !== undefined) { await practiceStore.jumpTo(idx); showQuestionList.value = false }
  resetAnswerState()
}

function resetAnswerState() {
  shortAnswer.value = ''
  codeAnswer.value = practiceStore.currentQuestion?.type === 'program' ? (practiceStore.currentQuestion.codeTemplate || '') : ''
}

function handleKeydown(e: KeyboardEvent) {
  if (showModeSelector.value) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  const sc = settingsStore.shortcuts
  const actions: Record<string, () => void> = {
    [sc.prevQuestion]: () => go('prev'),
    [sc.nextQuestion]: () => go('next'),
    [sc.submitAnswer]: () => !practiceStore.state.isSubmitted && handleSubmit(),
    [sc.toggleExplanation]: () => practiceStore.toggleExplanation(),
    [sc.toggleFavorite]: () => practiceStore.toggleFavorite(),
    [sc.toggleMemorize]: () => practiceStore.toggleMemorizeMode(),
    [sc.optionA]: () => practiceStore.selectOption(0),
    [sc.optionB]: () => practiceStore.selectOption(1),
    [sc.optionC]: () => practiceStore.selectOption(2),
    [sc.optionD]: () => practiceStore.selectOption(3),
  }
  if (actions[e.code]) { e.preventDefault(); actions[e.code]() }
}

onMounted(() => {
  questionStore.loadBanks()
  questionStore.loadCategories()
  window.addEventListener('keydown', handleKeydown)
  const modeParam = route.query.mode as PracticeMode
  if (modeParam && modeList.some(m => m.key === modeParam)) {
    if (route.query.bankId) selectedBankIds.value = [Number(route.query.bankId)]
    if (route.query.types) selectedTypes.value = [route.query.types as string]
    startMode(modeParam)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  practiceStore.resetPractice()
})

const progressPercent = computed(() =>
  practiceStore.totalQuestions === 0 ? 0 : ((practiceStore.state.currentIndex + 1) / practiceStore.totalQuestions) * 100
)
</script>

<template>
  <div class="max-w-4xl mx-auto animate-fade-in">
    <div v-if="showModeSelector" class="space-y-6">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">选择刷题模式</h1>
        <p class="text-zinc-500 dark:text-zinc-400">选择一种适合你的练习方式</p>
      </div>

      <div class="card p-5 space-y-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            选择题库 <span class="text-zinc-400 font-normal">(可多选)</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="bank in questionStore.banks"
              :key="bank.id"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="selectedBankIds.includes(bank.id!) ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'"
              @click="toggleArr(selectedBankIds, bank.id!)"
            >
              {{ bank.name }}
            </button>
            <span v-if="!questionStore.banks.length" class="text-sm text-zinc-400">暂无题库</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            选择题型 <span class="text-zinc-400 font-normal">(不选则包含全部题型)</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in questionTypes"
              :key="t.value"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="selectedTypes.includes(t.value) ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'"
              @click="toggleArr(selectedTypes, t.value)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="mode in modeList" :key="mode.key" class="card-hover p-5 cursor-pointer group text-center" @click="startMode(mode.key)">
          <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 mx-auto bg-gradient-to-br transition-transform group-hover:scale-110" :class="mode.color">
            <BookOpen class="w-7 h-7" />
          </div>
          <h3 class="font-semibold text-zinc-900 dark:text-white mb-1">{{ mode.name }}</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ mode.desc }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between mb-4">
        <button class="btn-ghost p-2 -ml-2" @click="backToModeSelect">
          <ChevronLeft class="w-5 h-5" />
          <span class="ml-1">返回</span>
        </button>
        <div class="text-center">
          <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ modeName(practiceStore.state.mode) }}</div>
          <div class="font-semibold text-zinc-900 dark:text-white">{{ practiceStore.state.currentIndex + 1 }} / {{ practiceStore.totalQuestions }}</div>
        </div>
        <button class="btn-ghost p-2 -mr-2" @click="showQuestionList = true">
          <List class="w-5 h-5" />
        </button>
      </div>

      <div class="progress-bar mb-4">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }" />
      </div>

      <div v-if="practiceStore.loading" class="card p-12 text-center">
        <div class="animate-pulse text-zinc-500">加载中...</div>
      </div>

      <div v-else-if="!practiceStore.currentQuestion" class="card p-12 text-center">
        <div class="text-zinc-500 mb-4">暂无题目</div>
        <button class="btn-primary" @click="backToModeSelect">返回选择模式</button>
      </div>

      <div v-else class="space-y-4">
        <div class="card p-5 md:p-6">
          <div class="flex items-start justify-between mb-4">
            <span class="tag-blue">{{ typeNameMap[practiceStore.currentQuestion.type] }}</span>
            <button
              class="p-2 -mr-2 rounded-lg transition-colors"
              :class="practiceStore.isFavorited ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'"
              @click="practiceStore.toggleFavorite()"
            >
              <Star class="w-5 h-5" :fill="practiceStore.isFavorited ? 'currentColor' : 'none'" />
            </button>
          </div>

          <div class="text-lg font-medium text-zinc-900 dark:text-white mb-6 leading-relaxed">
            {{ practiceStore.currentQuestion.content }}
          </div>

          <OptionList
            v-if="['single', 'multiple', 'judge'].includes(practiceStore.currentQuestion.type)"
            :options="practiceStore.currentQuestion.options"
            :type="practiceStore.currentQuestion.type"
            :user-answer="practiceStore.state.userAnswer as string"
            :correct-answer="practiceStore.currentQuestion.answer"
            :is-submitted="practiceStore.state.isSubmitted"
            @select="practiceStore.selectOption"
          />

          <div v-else-if="practiceStore.currentQuestion.type === 'short'" class="space-y-3">
            <textarea
              v-model="shortAnswer"
              class="input min-h-[120px] resize-y"
              placeholder="请输入你的答案..."
              :disabled="practiceStore.state.isSubmitted"
            />
            <div v-if="practiceStore.state.isSubmitted" class="text-sm">
              <span class="text-zinc-500 dark:text-zinc-400">你的答案：</span>
              <span :class="practiceStore.state.isCorrect ? 'text-success-600' : 'text-danger-600'" class="font-medium">
                {{ shortAnswer || '(未作答)' }}
              </span>
            </div>
          </div>

          <div v-else-if="practiceStore.currentQuestion.type === 'program'" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-500 dark:text-zinc-400">
                语言：{{ practiceStore.currentQuestion.language || 'javascript' }}
              </span>
            </div>
            <div class="min-h-[300px]">
              <CodeEditor
                v-model="codeAnswer"
                :language="practiceStore.currentQuestion.language || 'javascript'"
                :read-only="practiceStore.state.isSubmitted"
                :theme="settingsStore.theme"
              />
            </div>
          </div>

          <ExplanationPanel
            v-if="practiceStore.state.isSubmitted || practiceStore.state.memorizeMode"
            :question="practiceStore.currentQuestion"
            :visible="practiceStore.state.showExplanation"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button class="btn-secondary flex-1 sm:flex-none" :disabled="!practiceStore.hasPrev" @click="go('prev')">
            <ChevronLeft class="w-4 h-4" />
            上一题
          </button>

          <button v-if="!practiceStore.state.isSubmitted" class="btn-primary flex-1" @click="handleSubmit">
            <Check class="w-4 h-4" />
            提交答案
          </button>
          <button v-else class="btn-primary flex-1" :disabled="!practiceStore.hasNext" @click="go('next')">
            下一题
            <ChevronRight class="w-4 h-4" />
          </button>

          <button
            class="btn-ghost"
            @click="practiceStore.toggleExplanation()"
            :title="practiceStore.state.showExplanation ? '隐藏解析' : '显示解析'"
          >
            <Eye v-if="practiceStore.state.showExplanation" class="w-5 h-5" />
            <EyeOff v-else class="w-5 h-5" />
          </button>

          <button
            class="btn-ghost"
            :class="practiceStore.state.memorizeMode ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : ''"
            @click="practiceStore.toggleMemorizeMode()"
            :title="practiceStore.state.memorizeMode ? '关闭背题模式' : '开启背题模式'"
          >
            <BookOpen class="w-5 h-5" />
          </button>
        </div>

        <div v-if="practiceStore.state.isSubmitted" class="card p-4">
          <div class="flex items-center justify-center">
            <div v-if="practiceStore.state.isCorrect" class="text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-2">
                <Check class="w-6 h-6 text-success-600" />
              </div>
              <div class="text-success-600 font-semibold">回答正确！</div>
            </div>
            <div v-else class="text-center">
              <div class="w-12 h-12 mx-auto rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-2">
                <X class="w-6 h-6 text-danger-600" />
              </div>
              <div class="text-danger-600 font-semibold">回答错误</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showQuestionList" class="fixed inset-0 bg-black/50 z-50" @click="showQuestionList = false" />
      </Transition>

      <Transition name="slide-right">
        <div v-if="showQuestionList" class="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-800 z-50 shadow-xl flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 class="font-semibold text-zinc-900 dark:text-white">题目列表</h3>
            <button class="btn-ghost p-2 -mr-2" @click="showQuestionList = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="(_, idx) in practiceStore.state.questionList"
                :key="idx"
                class="aspect-square rounded-lg text-sm font-medium transition-all"
                :class="idx === practiceStore.state.currentIndex ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'"
                @click="go('jump', idx)"
              >
                {{ idx + 1 }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>

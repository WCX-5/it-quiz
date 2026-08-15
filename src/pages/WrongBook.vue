<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle, Play, Filter } from 'lucide-vue-next'
import { getWrongQuestions } from '@/composables/useIndexedDB'
import { useQuestionStore } from '@/stores/question'
import { typeNameMap, formatTime, truncate, questionTypesWithAll } from '@/utils/constants'
import type { WrongQuestion, Question } from '@/types'

const router = useRouter()
const questionStore = useQuestionStore()

const wrongQuestions = ref<WrongQuestion[]>([])
const questionDetails = ref<Map<number, Question>>(new Map())
const loading = ref(true)

const filterType = ref('')
const filterBankId = ref<number | ''>('')

const filteredWrong = computed(() => {
  let result = wrongQuestions.value
  if (filterType.value) {
    result = result.filter((w) => {
      const q = questionDetails.value.get(w.questionId)
      return q?.type === filterType.value
    })
  }
  if (filterBankId.value !== '') {
    result = result.filter((w) => {
      const q = questionDetails.value.get(w.questionId)
      return q?.bankId === filterBankId.value
    })
  }
  return result
})

async function loadWrongQuestions() {
  loading.value = true
  try {
    wrongQuestions.value = await getWrongQuestions()
    wrongQuestions.value.sort((a, b) => b.lastWrongTime - a.lastWrongTime)
    for (const w of wrongQuestions.value) {
      const q = await questionStore.getQuestionById(w.questionId)
      if (q && q.id) questionDetails.value.set(w.questionId, q)
    }
  } finally {
    loading.value = false
  }
}

function startWrongPractice() {
  const query: Record<string, string> = { mode: 'wrong' }
  if (filterBankId.value !== '') query.bankId = String(filterBankId.value)
  if (filterType.value) query.types = filterType.value
  router.push({ path: '/practice', query })
}

onMounted(async () => {
  await questionStore.loadBanks()
  await loadWrongQuestions()
})
</script>

<template>
  <div class="max-w-4xl mx-auto animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white flex items-center">
          <XCircle class="w-7 h-7 mr-3 text-danger-500" />
          错题本
        </h1>
        <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          共 {{ wrongQuestions.length }} 道错题，当前筛选 {{ filteredWrong.length }} 道
        </p>
      </div>
      <button
        v-if="filteredWrong.length > 0"
        class="btn-primary"
        @click="startWrongPractice"
      >
        <Play class="w-4 h-4" />
        开始重刷
      </button>
    </div>

    <div v-if="wrongQuestions.length > 0" class="mb-4 flex flex-wrap items-center gap-3">
      <Filter class="w-4 h-4 text-zinc-400" />
      <select v-model="filterBankId" class="input sm:w-40">
        <option :value="''">全部题库</option>
        <option v-for="bank in questionStore.banks" :key="bank.id" :value="bank.id">
          {{ bank.name }}
        </option>
      </select>
      <select v-model="filterType" class="input sm:w-40">
        <option v-for="t in questionTypesWithAll" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <div class="animate-pulse text-zinc-500">加载中...</div>
    </div>

    <div v-else-if="wrongQuestions.length === 0" class="card p-12 text-center">
      <div class="w-20 h-20 mx-auto rounded-full bg-success-50 dark:bg-success-900/20 flex items-center justify-center mb-4">
        <XCircle class="w-10 h-10 text-success-500" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">太棒了！</h3>
      <p class="text-zinc-500 dark:text-zinc-400 mb-6">暂无错题，继续保持哦</p>
      <button class="btn-primary" @click="router.push('/practice')">
        去刷题
      </button>
    </div>

    <div v-else-if="filteredWrong.length === 0" class="card p-12 text-center">
      <div class="text-zinc-500 mb-4">该筛选条件下暂无错题</div>
      <button class="btn-secondary" @click="filterBankId = ''; filterType = ''">
        清除筛选
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="w in filteredWrong"
        :key="w.questionId"
        class="card p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-10 h-10 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center text-danger-600 font-semibold text-sm"
          >
            错 {{ w.wrongCount }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span
                v-if="questionDetails.get(w.questionId)"
                class="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              >
                {{ typeNameMap[questionDetails.get(w.questionId)!.type] }}
              </span>
              <span
                v-if="questionDetails.get(w.questionId)"
                class="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300"
              >
                {{ questionStore.banks.find(b => b.id === questionDetails.get(w.questionId)!.bankId)?.name || '未知题库' }}
              </span>
              <span class="text-xs text-zinc-500 dark:text-zinc-400">
                最近错误：{{ formatTime(w.lastWrongTime) }}
              </span>
            </div>
            <div class="text-zinc-800 dark:text-zinc-100 leading-relaxed">
              {{ questionDetails.get(w.questionId) ? truncate(questionDetails.get(w.questionId)!.content, 120) : '题目已删除' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

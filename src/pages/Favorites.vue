<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Play, Filter } from 'lucide-vue-next'
import { getFavorites } from '@/composables/useIndexedDB'
import { useQuestionStore } from '@/stores/question'
import { typeNameMap, truncate, questionTypesWithAll } from '@/utils/constants'
import type { Favorite, Question } from '@/types'

const router = useRouter()
const questionStore = useQuestionStore()

const favorites = ref<Favorite[]>([])
const questionDetails = ref<Map<number, Question>>(new Map())
const loading = ref(true)

const filterType = ref('')

const filteredFavorites = computed(() => {
  if (!filterType.value) return favorites.value
  return favorites.value.filter((f) => {
    const q = questionDetails.value.get(f.questionId)
    return q?.type === filterType.value
  })
})

async function loadFavorites() {
  loading.value = true
  try {
    favorites.value = await getFavorites()
    favorites.value.sort((a, b) => b.timestamp - a.timestamp)
    for (const f of favorites.value) {
      const q = await questionStore.getQuestionById(f.questionId)
      if (q && q.id) questionDetails.value.set(f.questionId, q)
    }
  } finally {
    loading.value = false
  }
}

const startFavoritePractice = () => router.push({ path: '/practice', query: { mode: 'favorite' } })
const formatTime = (t: number) => new Date(t).toLocaleDateString()

onMounted(() => loadFavorites())
</script>

<template>
  <div class="max-w-4xl mx-auto animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white flex items-center">
          <Star class="w-7 h-7 mr-3 text-amber-500" fill="currentColor" />
          我的收藏
        </h1>
        <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          共 {{ favorites.length }} 道收藏题目
        </p>
      </div>
      <button
        v-if="favorites.length > 0"
        class="btn-primary"
        @click="startFavoritePractice"
      >
        <Play class="w-4 h-4" />
        开始练习
      </button>
    </div>

    <div v-if="favorites.length > 0" class="mb-4 flex items-center gap-3">
      <Filter class="w-4 h-4 text-zinc-400" />
      <select v-model="filterType" class="input sm:w-40">
        <option v-for="t in questionTypesWithAll" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <div class="animate-pulse text-zinc-500">加载中...</div>
    </div>

    <div v-else-if="favorites.length === 0" class="card p-12 text-center">
      <div class="w-20 h-20 mx-auto rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <Star class="w-10 h-10 text-amber-500" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">暂无收藏</h3>
      <p class="text-zinc-500 dark:text-zinc-400 mb-6">刷题时点击收藏按钮可以收藏题目</p>
      <button class="btn-primary" @click="router.push('/practice')">
        去刷题
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="f in filteredFavorites"
        :key="f.questionId"
        class="card p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Star class="w-5 h-5 text-amber-500" fill="currentColor" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span
                v-if="questionDetails.get(f.questionId)"
                class="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              >
                {{ typeNameMap[questionDetails.get(f.questionId)!.type] }}
              </span>
              <span class="text-xs text-zinc-500 dark:text-zinc-400">
                收藏于 {{ formatTime(f.timestamp) }}
              </span>
            </div>
            <div class="text-zinc-800 dark:text-zinc-100 leading-relaxed">
              {{ questionDetails.get(f.questionId) ? truncate(questionDetails.get(f.questionId)!.content, 120) : '题目已删除' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

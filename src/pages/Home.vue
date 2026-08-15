<script setup lang="ts">
import { ChevronRight, Play, Shuffle, List, XCircle, Star, BookMarked, BookOpen } from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'
import { useRouter } from 'vue-router'
import { statCards, getStatValue } from '@/utils/constants'

const statsStore = useStatsStore()
const router = useRouter()

const practiceModes = [
  { key: 'sequential', name: '顺序刷题', desc: '按题库顺序依次练习', icon: List, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { key: 'random', name: '随机刷题', desc: '从全题库随机抽取练习', icon: Shuffle, color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
  { key: 'wrong', name: '错题重刷', desc: '针对性练习错题', icon: XCircle, color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
  { key: 'favorite', name: '收藏刷题', desc: '练习收藏的题目', icon: Star, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
]

const startMode = (mode: string) => router.push({ path: '/practice', query: { mode } })
const quickEntries = [
  { label: '错题本', path: '/wrong', icon: XCircle, color: 'text-red-500', count: () => statsStore.wrongCount },
  { label: '我的收藏', path: '/favorites', icon: Star, color: 'text-amber-500', count: () => statsStore.favoriteCount },
  { label: '学习数据', path: '/stats', icon: BookMarked, color: 'text-purple-500', count: () => null },
]
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <section>
      <div class="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div class="relative z-10">
          <h1 class="text-2xl md:text-3xl font-bold mb-2">开始今天的学习吧</h1>
          <p class="text-primary-100 mb-6">坚持刷题，每天进步一点点</p>
          <div class="flex flex-wrap gap-3">
            <button class="bg-white text-primary-700 hover:bg-primary-50 px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all hover:shadow-lg" @click="startMode('sequential')">
              <Play class="w-4 h-4" />
              开始刷题
            </button>
            <button class="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-all" @click="router.push('/exam')">
              模拟考试
            </button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="stat in statCards" :key="stat.key" class="card p-4 md:p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br" :class="stat.gradient">
              <component :is="stat.icon" class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
            {{ getStatValue(stat.key, statsStore) }}{{ stat.suffix || '' }}
          </div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">刷题模式</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="mode in practiceModes" :key="mode.key" class="card-hover p-4 cursor-pointer group" @click="startMode(mode.key)">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" :class="mode.color">
            <component :is="mode.icon" class="w-6 h-6" />
          </div>
          <h3 class="font-semibold text-zinc-900 dark:text-white mb-1">{{ mode.name }}</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{{ mode.desc }}</p>
          <div class="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
            开始练习
            <ChevronRight class="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </section>

    <section class="grid md:grid-cols-2 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-zinc-900 dark:text-white">今日进度</h3>
          <span class="text-sm text-zinc-500 dark:text-zinc-400">{{ statsStore.todayCount }} 题</span>
        </div>
        <div class="progress-bar mb-2">
          <div class="progress-bar-fill" :style="{ width: Math.min(100, (statsStore.todayCount / 50) * 100) + '%' }" />
        </div>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">目标：每天 50 题，还差 {{ Math.max(0, 50 - statsStore.todayCount) }} 题</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-zinc-900 dark:text-white">快速入口</h3>
        </div>
        <div class="space-y-2">
          <button
            v-for="entry in quickEntries"
            :key="entry.path"
            class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-left"
            @click="router.push(entry.path)"
          >
            <div class="flex items-center">
              <component :is="entry.icon" class="w-5 h-5 mr-3" :class="entry.color" />
              <span class="text-zinc-700 dark:text-zinc-200">{{ entry.label }}</span>
            </div>
            <span v-if="entry.count() !== null" class="text-sm text-zinc-500 dark:text-zinc-400">{{ entry.count() }} 题</span>
            <ChevronRight v-else class="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

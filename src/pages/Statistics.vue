<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BarChart3, Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'
import { useQuestionStore } from '@/stores/question'
import { statCards, getStatValue } from '@/utils/constants'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const statsStore = useStatsStore()
const questionStore = useQuestionStore()

const currentMonth = ref(new Date())

const last7DaysStats = computed(() => statsStore.getLastNDaysStats(7))
const last30DaysStats = computed(() => statsStore.getLastNDaysStats(30))

const weekChartData = computed(() => {
  const stats = last7DaysStats.value
  return {
    labels: stats.map((s) => s.date.slice(5)),
    datasets: [
      {
        label: '刷题数',
        data: stats.map((s) => s.totalCount),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const weekChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}

const typeDistribution = computed(async () => {
  const counts: Record<string, number> = {
    single: 0,
    multiple: 0,
    judge: 0,
    short: 0,
    program: 0,
  }
  
  for (const q of questionStore.questions) {
    counts[q.type] = (counts[q.type] || 0) + 1
  }
  
  return counts
})

const doughnutData = computed(() => ({
  labels: ['单选题', '多选题', '判断题', '简答题', '编程题'],
  datasets: [
    {
      data: [30, 20, 25, 15, 10],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderWidth: 0,
    },
  ],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
      },
    },
  },
  cutout: '65%',
}

const calendarWeeks = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return statsStore.generateCalendarHeatmap(year, month)
})

const monthLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

function prevMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
}

function nextMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
}

function getDayIntensity(stat: { totalCount: number } | null): string {
  if (!stat || stat.totalCount === 0) return 'bg-zinc-100 dark:bg-zinc-800'
  if (stat.totalCount < 10) return 'bg-primary-200 dark:bg-primary-900'
  if (stat.totalCount < 30) return 'bg-primary-400 dark:bg-primary-700'
  if (stat.totalCount < 50) return 'bg-primary-500 dark:bg-primary-600'
  return 'bg-primary-700 dark:bg-primary-500'
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

onMounted(async () => {
  await statsStore.loadStats()
  await questionStore.loadQuestions(1)
})
</script>

<template>
  <div class="max-w-6xl mx-auto animate-fade-in space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white flex items-center">
        <BarChart3 class="w-7 h-7 mr-3 text-primary-500" />
        数据统计
      </h1>
      <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">查看你的学习数据与进度</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="stat in statCards" :key="stat.key" class="card p-4">
        <div class="flex items-center gap-3 mb-2">
          <component :is="stat.icon" class="w-5 h-5" :class="stat.color" />
          <span class="text-sm text-zinc-500 dark:text-zinc-400">{{ stat.label }}</span>
        </div>
        <div class="text-2xl font-bold text-zinc-900 dark:text-white">
          {{ getStatValue(stat.key, statsStore) }}{{ stat.suffix || '' }}
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-zinc-900 dark:text-white mb-4">近7天刷题趋势</h3>
        <div class="h-64">
          <Bar :data="weekChartData" :options="weekChartOptions" />
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-zinc-900 dark:text-white mb-4">题型分布</h3>
        <div class="h-64">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-zinc-900 dark:text-white flex items-center">
          <Calendar class="w-5 h-5 mr-2 text-primary-500" />
          打卡日历
        </h3>
        <div class="flex items-center gap-2">
          <button class="btn-ghost p-1.5" @click="prevMonth">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200 w-28 text-center">
            {{ monthLabel }}
          </span>
          <button class="btn-ghost p-1.5" @click="nextMonth">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-xs text-zinc-500 dark:text-zinc-400 py-1"
        >
          {{ day }}
        </div>
      </div>

      <div class="space-y-1">
        <div v-for="(week, wi) in calendarWeeks" :key="wi" class="grid grid-cols-7 gap-1">
          <div
            v-for="(day, di) in week"
            :key="di"
            class="aspect-square rounded-md flex items-center justify-center text-xs"
            :class="day ? getDayIntensity(day) : 'bg-transparent'"
          >
            <span v-if="day" :class="day.totalCount > 10 ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'">
              {{ new Date(day.date).getDate() }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 mt-4 text-xs text-zinc-500">
        <span>少</span>
        <div class="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800"></div>
        <div class="w-4 h-4 rounded bg-primary-200 dark:bg-primary-900"></div>
        <div class="w-4 h-4 rounded bg-primary-400 dark:bg-primary-700"></div>
        <div class="w-4 h-4 rounded bg-primary-500 dark:bg-primary-600"></div>
        <div class="w-4 h-4 rounded bg-primary-700 dark:bg-primary-500"></div>
        <span>多</span>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-zinc-900 dark:text-white mb-4">累计数据</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
          <div class="text-2xl font-bold text-primary-600">{{ statsStore.streakDays }}</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">连续打卡天数</div>
        </div>
        <div class="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
          <div class="text-2xl font-bold text-success-600">{{ statsStore.checkInRecords.length }}</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">总打卡天数</div>
        </div>
        <div class="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
          <div class="text-2xl font-bold text-danger-600">{{ statsStore.wrongCount }}</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">错题数</div>
        </div>
        <div class="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
          <div class="text-2xl font-bold text-amber-600">{{ statsStore.favoriteCount }}</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">收藏数</div>
        </div>
      </div>
    </div>
  </div>
</template>

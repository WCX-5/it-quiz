<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Settings,
  Sun,
  Moon,
  Type,
  Keyboard,
  Database,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useStatsStore } from '@/stores/stats'
import { useQuestionStore } from '@/stores/question'
import { clearAllQuestions } from '@/composables/useIndexedDB'
import { exportAllData, clearAllLocalData } from '@/utils/storage'
import { downloadFile } from '@/utils/questionParser'
import { formatShortcut } from '@/utils/constants'

const router = useRouter()
const settingsStore = useSettingsStore()
const statsStore = useStatsStore()
const questionStore = useQuestionStore()

const fontSizes = [14, 16, 18, 20]

const shortcutItems = [
  { key: 'prevQuestion', label: '上一题', desc: '切换到上一道题' },
  { key: 'nextQuestion', label: '下一题', desc: '切换到下一道题' },
  { key: 'submitAnswer', label: '提交答案', desc: '提交当前题目答案' },
  { key: 'toggleExplanation', label: '显示/隐藏解析', desc: '切换答案解析显示' },
  { key: 'toggleFavorite', label: '收藏/取消收藏', desc: '收藏当前题目' },
  { key: 'toggleMemorize', label: '背题模式', desc: '切换背题模式' },
  { key: 'optionA', label: '选项A', desc: '选择第一个选项' },
  { key: 'optionB', label: '选项B', desc: '选择第二个选项' },
  { key: 'optionC', label: '选项C', desc: '选择第三个选项' },
  { key: 'optionD', label: '选项D', desc: '选择第四个选项' },
]

function handleExportData() {
  const data = exportAllData()
  downloadFile(data, `刷题数据备份_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
}

async function handleClearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：所有题库、记录、配置都将被清空，确定继续？')) {
      await clearAllQuestions()
      clearAllLocalData()
      questionStore.questions = []
      questionStore.totalCount = 0
      statsStore.loadStats()
      settingsStore.config.theme = 'light'
      settingsStore.config.fontSize = 16
      settingsStore.initTheme()
      alert('数据已清空')
    }
  }
}

function handleResetShortcuts() {
  if (confirm('确定要重置所有快捷键吗？')) {
    settingsStore.resetShortcuts()
  }
}

const aboutItems = [
  { label: '版本', value: 'v1.0.0' },
  { label: '技术栈', value: 'Vue 3 + TypeScript + Vite' },
  { label: '数据存储', value: 'IndexedDB + LocalStorage' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto animate-fade-in space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-white flex items-center">
        <Settings class="w-7 h-7 mr-3 text-primary-500" />
        设置
      </h1>
      <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">个性化你的刷题体验</p>
    </div>

    <div class="card overflow-hidden">
      <div class="p-5 border-b border-zinc-100 dark:border-zinc-700">
        <h2 class="font-semibold text-zinc-900 dark:text-white flex items-center">
          <Sun class="w-5 h-5 mr-2 text-primary-500" />
          外观设置
        </h2>
      </div>

      <div class="divide-y divide-zinc-100 dark:divide-zinc-700">
        <div class="p-5 flex items-center justify-between">
          <div>
            <div class="font-medium text-zinc-900 dark:text-white">深色模式</div>
            <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {{ settingsStore.theme === 'dark' ? '已开启深色模式' : '使用浅色模式' }}
            </div>
          </div>
          <button
            class="relative w-12 h-6 rounded-full transition-colors"
            :class="settingsStore.theme === 'dark' ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-600'"
            @click="settingsStore.toggleTheme()"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="settingsStore.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium text-zinc-900 dark:text-white flex items-center">
              <Type class="w-5 h-5 mr-2 text-primary-500" />
              字体大小
            </div>
            <span class="text-sm text-zinc-500">{{ settingsStore.fontSize }}px</span>
          </div>
          <div class="flex gap-2">
            <button
              v-for="size in fontSizes"
              :key="size"
              class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              :class="
                settingsStore.fontSize === size
                  ? 'bg-primary-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              "
              @click="settingsStore.setFontSize(size)"
            >
              {{ size }}px
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-5 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
        <h2 class="font-semibold text-zinc-900 dark:text-white flex items-center">
          <Keyboard class="w-5 h-5 mr-2 text-primary-500" />
          快捷键
        </h2>
        <button
          class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          @click="handleResetShortcuts"
        >
          重置
        </button>
      </div>

      <div class="divide-y divide-zinc-100 dark:divide-zinc-700">
        <div
          v-for="item in shortcutItems"
          :key="item.key"
          class="p-4 flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-medium text-zinc-900 dark:text-white">{{ item.label }}</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ item.desc }}</div>
          </div>
          <kbd
            class="px-2.5 py-1 text-xs font-mono rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600"
          >
            {{ formatShortcut(settingsStore.shortcuts[item.key]) }}
          </kbd>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-5 border-b border-zinc-100 dark:border-zinc-700">
        <h2 class="font-semibold text-zinc-900 dark:text-white flex items-center">
          <Database class="w-5 h-5 mr-2 text-primary-500" />
          数据管理
        </h2>
      </div>

      <div class="divide-y divide-zinc-100 dark:divide-zinc-700">
        <button
          class="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors text-left"
          @click="handleExportData"
        >
          <div class="flex items-center">
            <Download class="w-5 h-5 mr-3 text-primary-500" />
            <div>
              <div class="font-medium text-zinc-900 dark:text-white">导出数据</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">导出所有配置与记录</div>
            </div>
          </div>
          <ChevronRight class="w-5 h-5 text-zinc-400" />
        </button>

        <button
          class="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors text-left"
          @click="router.push('/questions')"
        >
          <div class="flex items-center">
            <Upload class="w-5 h-5 mr-3 text-success-500" />
            <div>
              <div class="font-medium text-zinc-900 dark:text-white">导入题库</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">从 Excel 或 JSON 文件导入</div>
            </div>
          </div>
          <ChevronRight class="w-5 h-5 text-zinc-400" />
        </button>

        <button
          class="w-full p-5 flex items-center justify-between hover:bg-danger-50 dark:hover:bg-danger-900/10 transition-colors text-left"
          @click="handleClearAllData"
        >
          <div class="flex items-center">
            <Trash2 class="w-5 h-5 mr-3 text-danger-500" />
            <div>
              <div class="font-medium text-danger-600">清空所有数据</div>
              <div class="text-sm text-danger-500/70 mt-0.5">删除题库、记录和所有配置</div>
            </div>
          </div>
          <ChevronRight class="w-5 h-5 text-danger-400" />
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-5 border-b border-zinc-100 dark:border-zinc-700">
        <h2 class="font-semibold text-zinc-900 dark:text-white flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary-500" />
          关于
        </h2>
      </div>
      <div class="divide-y divide-zinc-100 dark:divide-zinc-700">
        <div
          v-for="item in aboutItems"
          :key="item.label"
          class="p-4 flex items-center justify-between"
        >
          <span class="text-sm text-zinc-500 dark:text-zinc-400">{{ item.label }}</span>
          <span class="text-sm text-zinc-700 dark:text-zinc-200">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

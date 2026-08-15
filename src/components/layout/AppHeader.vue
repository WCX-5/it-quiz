<script setup lang="ts">
import { Menu, Sun, Moon, Search } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
defineProps<{ title?: string }>()
const emit = defineEmits<{ toggleSidebar: [] }>()
</script>

<template>
  <header class="sticky top-0 z-20 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-700">
    <div class="flex items-center h-16 px-4 md:px-6">
      <button class="md:hidden btn-ghost p-2 -ml-2" @click="emit('toggleSidebar')">
        <Menu class="w-5 h-5" />
      </button>

      <div class="md:hidden flex items-center ml-2">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">Q</div>
        <span class="ml-2 font-semibold text-zinc-900 dark:text-white truncate">{{ title || 'IT刷题' }}</span>
      </div>

      <h1 class="hidden md:block text-lg font-semibold text-zinc-900 dark:text-white">{{ title || 'IT刷题' }}</h1>

      <div class="flex-1"></div>

      <div class="hidden sm:flex items-center mr-2">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="搜索题目..."
            class="pl-9 pr-4 py-2 w-48 sm:w-56 md:w-64 text-sm bg-zinc-100 dark:bg-zinc-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
      </div>

      <button
        class="btn-ghost p-2 shrink-0"
        @click="settingsStore.toggleTheme()"
        :title="settingsStore.theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
      >
        <Sun v-if="settingsStore.theme === 'dark'" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>

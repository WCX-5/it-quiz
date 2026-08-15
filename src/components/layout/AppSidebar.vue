<script setup lang="ts">
import { useRoute } from 'vue-router'
import { navItems, isActivePath } from '@/utils/constants'

const route = useRoute()
</script>

<template>
  <aside class="flex flex-col h-full bg-white dark:bg-zinc-800">
    <div class="flex items-center h-16 px-6 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shrink-0">Q</div>
      <span class="ml-3 text-lg font-semibold text-zinc-900 dark:text-white">IT刷题</span>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="isActivePath(item.path, route.path) ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'"
      >
        <component :is="item.icon" class="w-5 h-5 mr-3 shrink-0" />
        {{ item.name }}
      </router-link>
    </nav>

    <div class="p-4 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
      <div class="text-xs text-zinc-500 dark:text-zinc-400">v1.0.0 · 本地存储</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { navItemsBottom, isActivePath } from '@/utils/constants'

const route = useRoute()
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 z-50"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <div class="grid grid-cols-5 h-16">
      <router-link
        v-for="item in navItemsBottom"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center h-full transition-colors"
        :class="isActivePath(item.path, route.path) ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500 dark:text-zinc-400'"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span class="text-[10px] sm:text-xs mt-0.5 truncate max-w-full px-1">{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>

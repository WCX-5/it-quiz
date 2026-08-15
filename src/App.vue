<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import { useStatsStore } from '@/stores/stats'
import { useQuestionStore } from '@/stores/question'
import { pageTitleMap } from '@/utils/constants'

const route = useRoute()
const statsStore = useStatsStore()
const questionStore = useQuestionStore()
const mobileSidebarOpen = ref(false)

const pageTitle = computed(() => {
  const match = Object.keys(pageTitleMap).find(k => k === '/' ? route.path === '/' : route.path.startsWith(k))
  return match ? pageTitleMap[match] : 'IT刷题'
})

// 路由变化时自动关闭移动端抽屉
watch(() => route.path, () => { mobileSidebarOpen.value = false })

onMounted(async () => {
  await statsStore.loadStats()
  await questionStore.loadCategories()
  await questionStore.loadTags()
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <!-- 桌面端固定侧边栏（>= 768px 显示） -->
    <div class="hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-60 lg:w-64 md:border-r md:border-zinc-200 dark:md:border-zinc-700 z-30">
      <AppSidebar />
    </div>

    <div class="md:pl-60 lg:pl-64">
      <AppHeader :title="pageTitle" @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />

      <main class="py-4 md:py-6 pb-24 md:pb-6 px-3 sm:px-4 md:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 移动端底部导航（< 768px 显示） -->
    <AppBottomNav />

    <!-- 移动端侧边栏抽屉 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="mobileSidebarOpen"
          class="fixed inset-0 bg-black/50 z-[70] md:hidden"
          @click="mobileSidebarOpen = false"
        />
      </Transition>

      <Transition name="slide-left">
        <div
          v-if="mobileSidebarOpen"
          class="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-[80] md:hidden shadow-2xl"
        >
          <AppSidebar />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active { transition: transform 0.3s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(-100%); }
</style>

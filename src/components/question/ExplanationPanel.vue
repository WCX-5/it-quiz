<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown, ChevronUp, BookOpen, Tag } from 'lucide-vue-next'
import type { Question } from '@/types'
import { typeNameMap, formatAnswer, difficultyStars } from '@/utils/constants'

const props = defineProps<{ question: Question; visible: boolean }>()
const isExpanded = ref(false)
watch(() => props.visible, v => isExpanded.value = v, { immediate: true })
</script>

<template>
  <div class="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
    <button class="w-full flex items-center justify-between py-2 text-left" @click="isExpanded = !isExpanded">
      <span class="font-medium text-zinc-700 dark:text-zinc-200 flex items-center">
        <BookOpen class="w-4 h-4 mr-2 text-primary-500" />
        答案与解析
      </span>
      <ChevronUp v-if="isExpanded" class="w-5 h-5 text-zinc-400" />
      <ChevronDown v-else class="w-5 h-5 text-zinc-400" />
    </button>

    <Transition name="expand">
      <div v-show="isExpanded" class="overflow-hidden">
        <div class="pb-2 space-y-4 animate-fade-in">
          <div class="flex flex-wrap gap-3 text-sm">
            <div>
              <span class="text-zinc-500 dark:text-zinc-400">题型：</span>
              <span class="tag-blue">{{ typeNameMap[question.type] }}</span>
            </div>
            <div>
              <span class="text-zinc-500 dark:text-zinc-400">难度：</span>
              <span class="text-amber-500">{{ difficultyStars(question.difficulty) }}</span>
            </div>
            <div v-if="question.category">
              <span class="text-zinc-500 dark:text-zinc-400">分类：</span>
              <span class="tag-gray">{{ question.category }}</span>
            </div>
          </div>

          <div class="bg-success-50 dark:bg-success-900/20 rounded-lg p-4">
            <div class="text-sm text-success-700 dark:text-success-300 font-medium mb-1">正确答案</div>
            <div class="text-success-800 dark:text-success-200 font-semibold">
              {{ formatAnswer(question) }}
            </div>
          </div>

          <div v-if="question.explanation" class="space-y-2">
            <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center">
              <Tag class="w-4 h-4 mr-2 text-primary-500" />
              解析
            </div>
            <div class="text-zinc-600 dark:text-zinc-300 leading-relaxed pl-6 whitespace-pre-wrap">
              {{ question.explanation }}
            </div>
          </div>

          <div v-if="question.tags && question.tags.length > 0" class="flex flex-wrap gap-2">
            <span v-for="tag in question.tags" :key="tag" class="tag-blue">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; max-height: 1000px; opacity: 1; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'
import type { QuestionType, Question } from '@/types'

const props = defineProps<{
  options: string[]
  type: QuestionType
  userAnswer: string | string[]
  correctAnswer: string | string[]
  isSubmitted: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [index: number] }>()

const isSel = (i: number) => {
  const letter = String.fromCharCode(65 + i)
  if (props.type === 'single' || props.type === 'judge') return props.userAnswer === letter
  if (props.type === 'multiple') return (props.userAnswer as string).includes(letter)
  return false
}
const isCorrect = (i: number) => {
  const letter = String.fromCharCode(65 + i)
  if (props.type === 'single' || props.type === 'judge') return props.correctAnswer === letter
  if (props.type === 'multiple') return (props.correctAnswer as string[]).includes(letter)
  return false
}

const optionClass = (i: number) => {
  const s = isSel(i), c = isCorrect(i), sub = props.isSubmitted
  const base = 'w-full flex items-start p-4 rounded-xl border-2 transition-all text-left '
  if (!sub) return base + (s ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ' : 'border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 ') + (!props.disabled ? 'cursor-pointer ' : 'cursor-default ')
  if (c) return base + 'border-success-500 bg-success-50 dark:bg-success-900/20 cursor-default '
  if (s && !c) return base + 'border-danger-500 bg-danger-50 dark:bg-danger-900/20 cursor-default '
  return base + 'border-zinc-200 dark:border-zinc-700 opacity-60 cursor-default '
}

const optionLabels = computed(() =>
  props.type === 'judge' ? ['正确', '错误'] : props.options.map((_, i) => String.fromCharCode(65 + i))
)
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(option, index) in options"
      :key="index"
      :class="optionClass(index)"
      @click="!disabled && !isSubmitted && emit('select', index)"
    >
      <div
        class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5"
        :class="{
          'bg-primary-500 text-white': isSel(index) && !isSubmitted,
          'bg-success-500 text-white': isSubmitted && isCorrect(index),
          'bg-danger-500 text-white': isSubmitted && isSel(index) && !isCorrect(index),
          'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300': !isSel(index) && !(isSubmitted && isCorrect(index)),
        }"
      >
        <Check v-if="isSubmitted && isCorrect(index)" class="w-4 h-4" />
        <X v-else-if="isSubmitted && isSel(index) && !isCorrect(index)" class="w-4 h-4" />
        <span v-else>{{ optionLabels[index] }}</span>
      </div>
      <div class="flex-1 text-zinc-800 dark:text-zinc-100 leading-relaxed">
        {{ option }}
      </div>
    </div>
  </div>
</template>

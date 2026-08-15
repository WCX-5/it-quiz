<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
  language?: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

function initEditor() {
  if (!editorContainer.value) return

  monaco.editor.defineTheme('it-quiz-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#18181b',
    },
  })

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language || 'javascript',
    theme: props.theme === 'dark' ? 'it-quiz-dark' : 'vs',
    readOnly: props.readOnly,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 12, bottom: 12 },
  })

  editor.onDidChangeModelContent(() => {
    if (editor) {
      emit('update:modelValue', editor.getValue())
    }
  })
}

watch(
  () => props.modelValue,
  (val) => {
    if (editor && editor.getValue() !== val) {
      editor.setValue(val)
    }
  }
)

watch(
  () => props.language,
  (lang) => {
    if (editor && lang) {
      monaco.editor.setModelLanguage(editor.getModel()!, lang)
    }
  }
)

watch(
  () => props.theme,
  (t) => {
    if (editor) {
      monaco.editor.setTheme(t === 'dark' ? 'it-quiz-dark' : 'vs')
    }
  }
)

onMounted(() => {
  initEditor()
})
</script>

<template>
  <div ref="editorContainer" class="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"></div>
</template>

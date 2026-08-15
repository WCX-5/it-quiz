<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Upload, Download, Search, Trash2, ChevronLeft, ChevronRight, X, Check,
  FileSpreadsheet, FileJson, BookOpen, MoreVertical, Pencil, CheckSquare, Square, Edit2,
} from 'lucide-vue-next'
import { useQuestionStore } from '@/stores/question'
import { useStatsStore } from '@/stores/stats'
import { updateQuestion } from '@/composables/useIndexedDB'
import { typeNameMap, questionTypesWithAll, typeTagClass, truncate } from '@/utils/constants'
import type { Question } from '@/types'

const questionStore = useQuestionStore()
const statsStore = useStatsStore()

const searchKeyword = ref('')
const showImportModal = ref(false)
const isDragging = ref(false)
const activeTab = ref<'questions' | 'banks'>('banks')
const showBankMenu = ref<number | null>(null)
const editingBankId = ref<number | null>(null)
const editingBankName = ref('')
const selectedBankIds = ref<Set<number>>(new Set())
const showEditModal = ref(false)
const editingQuestion = ref<Question | null>(null)
const editAnswerText = ref('')
const editOptionStr = ref('')
const selectedFile = ref<File | null>(null)
const importBankName = ref('')
const importBankDesc = ref('')

const canImport = computed(() => selectedFile.value && importBankName.value.trim())
const hasSelectedBanks = computed(() => selectedBankIds.value.size > 0)

onMounted(async () => {
  await questionStore.loadBanks()
  await questionStore.loadQuestions(1)
  await questionStore.loadCategories()
  await questionStore.loadTags()
})

const handleSearch = () => questionStore.searchQuestions(searchKeyword.value)
const handleFilter = () => questionStore.loadQuestions(1)
const prevPage = () => questionStore.currentPage > 1 && questionStore.loadQuestions(questionStore.currentPage - 1)
const nextPage = () => questionStore.currentPage < questionStore.totalPages && questionStore.loadQuestions(questionStore.currentPage + 1)

function handleFile(file: File) {
  selectedFile.value = file
  if (!importBankName.value.trim()) importBankName.value = file.name.replace(/\.[^/.]+$/, '')
}
const handleDrop = (e: DragEvent) => { e.preventDefault(); isDragging.value = false; if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]) }
const handleFileSelect = (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f) }

function openImportModal() {
  showImportModal.value = true
  selectedFile.value = null
  importBankName.value = ''
  importBankDesc.value = ''
  questionStore.resetImportProgress()
}

async function startImport() {
  if (!selectedFile.value || !importBankName.value.trim()) return
  try {
    await questionStore.importFromFile(selectedFile.value, importBankName.value.trim(), importBankDesc.value.trim())
    await statsStore.loadStats()
    setTimeout(() => { showImportModal.value = false; selectedFile.value = null; importBankName.value = ''; importBankDesc.value = ''; questionStore.resetImportProgress() }, 1500)
  } catch (err) { console.error('Import failed:', err) }
}

const handleExport = () => questionStore.exportQuestions()
const handleDelete = async (id: number) => { if (confirm('确定要删除这道题目吗？')) await questionStore.removeQuestion(id) }

function selectBank(bankId: number | '') {
  questionStore.filterBankId = bankId
  activeTab.value = 'questions'
  questionStore.loadQuestions(1)
}

function toggleBankSelect(id: number, e: Event) {
  e.stopPropagation()
  selectedBankIds.value.has(id) ? selectedBankIds.value.delete(id) : selectedBankIds.value.add(id)
}

async function batchDeleteBanks() {
  if (!selectedBankIds.value.size) return
  if (confirm(`确定要删除选中的 ${selectedBankIds.value.size} 个题库吗？题库下的所有题目都将被删除，此操作不可恢复！`)) {
    for (const id of Array.from(selectedBankIds.value)) await questionStore.removeBank(id)
    selectedBankIds.value.clear()
  }
}

function startEditBank(id: number, name: string) { editingBankId.value = id; editingBankName.value = name; showBankMenu.value = null }
async function saveEditBank(id: number) {
  if (!editingBankName.value.trim()) return
  await questionStore.renameBank(id, editingBankName.value.trim())
  editingBankId.value = null; editingBankName.value = ''
}
const cancelEditBank = () => { editingBankId.value = null; editingBankName.value = '' }

async function handleDeleteBank(id: number, name: string) {
  if (confirm(`确定要删除题库"${name}"吗？该题库下的所有题目都将被删除，此操作不可恢复！`)) {
    await questionStore.removeBank(id)
    showBankMenu.value = null
    selectedBankIds.value.delete(id)
  }
}

function openEditQuestion(q: Question) {
  editingQuestion.value = JSON.parse(JSON.stringify(q))
  editAnswerText.value = Array.isArray(q.answer) ? q.answer.join('') : q.answer
  editOptionStr.value = q.options.join('\n')
  showEditModal.value = true
}

async function saveEditQuestion() {
  if (!editingQuestion.value) return
  const q = editingQuestion.value
  q.answer = q.type === 'multiple' ? editAnswerText.value.toUpperCase().split('').filter(c => /[A-Z]/.test(c)) : editAnswerText.value
  q.options = editOptionStr.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
  await updateQuestion(q)
  showEditModal.value = false
  editingQuestion.value = null
  await questionStore.loadQuestions(questionStore.currentPage)
}
</script>

<template>
  <div class="max-w-6xl mx-auto animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">题库管理</h1>
        <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          共 {{ questionStore.banks.length }} 个题库，{{ questionStore.totalCount }} 道题目
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="activeTab === 'banks' && hasSelectedBanks" class="btn-danger" @click="batchDeleteBanks">
          <Trash2 class="w-4 h-4" />
          <span class="hidden sm:inline">删除选中</span>
          <span class="sm:hidden">({{ selectedBankIds.size }})</span>
        </button>
        <button class="btn-secondary" @click="handleExport">
          <Download class="w-4 h-4" />
          <span class="hidden sm:inline">导出题库</span>
        </button>
        <button class="btn-primary" @click="openImportModal">
          <Upload class="w-4 h-4" />
          <span class="hidden sm:inline">导入题库</span>
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700">
      <button
        v-for="tab in [{ k: 'banks', l: '题库列表' }, { k: 'questions', l: '题目列表' }]"
        :key="tab.k"
        class="px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors"
        :class="activeTab === tab.k ? 'border-primary-500 text-primary-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'"
        @click="activeTab = tab.k as 'questions' | 'banks'"
      >
        {{ tab.l }}
      </button>
    </div>

    <div v-if="activeTab === 'banks'" class="space-y-4">
      <div v-if="questionStore.banks.length === 0" class="card p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
          <BookOpen class="w-8 h-8 text-zinc-400" />
        </div>
        <div class="text-zinc-500 mb-4">暂无题库</div>
        <button class="btn-primary" @click="openImportModal">
          <Upload class="w-4 h-4" />
          导入题库
        </button>
      </div>

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="bank in questionStore.banks"
          :key="bank.id"
          class="card p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
          :class="{ 'ring-2 ring-primary-500': questionStore.filterBankId === bank.id }"
          @click="selectBank(bank.id!)"
        >
          <div class="absolute top-3 left-3 z-10" @click.stop>
            <button class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" @click="toggleBankSelect(bank.id!, $event)">
              <CheckSquare v-if="selectedBankIds.has(bank.id!)" class="w-5 h-5 text-primary-500" />
              <Square v-else class="w-5 h-5 text-zinc-300 dark:text-zinc-500" />
            </button>
          </div>

          <div class="flex items-start justify-between mb-3 pl-8">
            <div v-if="editingBankId === bank.id" class="flex-1 flex items-center gap-2" @click.stop>
              <input v-model="editingBankName" class="input text-sm flex-1" @keyup.enter="saveEditBank(bank.id!)" @keyup.esc="cancelEditBank" autofocus />
              <button class="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded" @click="saveEditBank(bank.id!)">
                <Check class="w-4 h-4" />
              </button>
              <button class="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded" @click="cancelEditBank">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div v-else class="flex-1 min-w-0">
              <h3 class="font-semibold text-zinc-900 dark:text-white truncate">{{ bank.name }}</h3>
            </div>
            <div class="relative" @click.stop>
              <button
                class="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="showBankMenu = showBankMenu === bank.id ? null : bank.id"
              >
                <MoreVertical class="w-4 h-4" />
              </button>
              <div v-if="showBankMenu === bank.id" class="absolute right-0 top-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-10 min-w-[120px]">
                <button class="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2" @click="startEditBank(bank.id!, bank.name)">
                  <Pencil class="w-4 h-4" />
                  重命名
                </button>
                <button class="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-2" @click="handleDeleteBank(bank.id!, bank.name)">
                  <Trash2 class="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-500 dark:text-zinc-400">{{ bank.questionCount }} 道题</span>
            <span class="text-zinc-400 text-xs">{{ new Date(bank.created_at).toLocaleDateString() }}</span>
          </div>
        </div>

        <div
          v-if="questionStore.filterBankId !== ''"
          class="card p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
          @click="selectBank('')"
        >
          <div class="text-center">
            <div class="text-zinc-500 dark:text-zinc-400 font-medium">查看全部题库</div>
            <div class="text-xs text-zinc-400 mt-1">取消当前筛选</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input v-model="searchKeyword" type="text" placeholder="搜索题目..." class="input pl-9" @keyup.enter="handleSearch" />
        </div>
        <select v-model="questionStore.filterBankId" class="input sm:w-40" @change="handleFilter">
          <option :value="''">全部题库</option>
          <option v-for="bank in questionStore.banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
        </select>
        <select v-model="questionStore.filterType" class="input sm:w-40" @change="handleFilter">
          <option v-for="t in questionTypesWithAll" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>

      <div v-if="questionStore.loading" class="card p-12 text-center">
        <div class="animate-pulse text-zinc-500">加载中...</div>
      </div>

      <div v-else-if="questionStore.questions.length === 0" class="card p-12 text-center">
        <div class="text-zinc-500 mb-4">暂无题目</div>
        <button class="btn-primary" @click="openImportModal">
          <Upload class="w-4 h-4" />
          导入题库
        </button>
      </div>

      <div v-else class="card overflow-hidden">
        <div class="divide-y divide-zinc-100 dark:divide-zinc-700">
          <div v-for="q in questionStore.questions" :key="q.id" class="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors">
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeTagClass[q.type]">{{ typeNameMap[q.type] }}</span>
                  <span class="text-xs text-amber-500">{{ '★'.repeat(q.difficulty) }}</span>
                </div>
                <div class="text-zinc-800 dark:text-zinc-100 text-sm leading-relaxed">{{ truncate(q.content, 150) }}</div>
                <div v-if="q.tags && q.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span v-for="tag in q.tags.slice(0, 3)" :key="tag" class="text-xs text-zinc-500 dark:text-zinc-400">#{{ tag }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button class="p-2 text-zinc-400 hover:text-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="修改题目" @click="openEditQuestion(q)">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button class="p-2 text-zinc-400 hover:text-danger-500 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors" title="删除题目" @click="handleDelete(q.id!)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-700">
          <div class="text-sm text-zinc-500 dark:text-zinc-400">第 {{ questionStore.currentPage }} / {{ questionStore.totalPages }} 页</div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="questionStore.currentPage <= 1" @click="prevPage">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="questionStore.currentPage >= questionStore.totalPages" @click="nextPage">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showImportModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showImportModal = false">
          <div class="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-lg shadow-xl animate-slide-up">
            <div class="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-700">
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">导入题库</h3>
              <button class="btn-ghost p-2 -mr-2" @click="showImportModal = false; selectedFile = null; questionStore.resetImportProgress()">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                  题库名称 <span class="text-danger-500">*</span>
                </label>
                <input v-model="importBankName" type="text" placeholder="请输入题库名称" class="input" />
                <p class="text-xs text-zinc-500 mt-1">默认为文件名，可自行修改</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题库描述</label>
                <input v-model="importBankDesc" type="text" placeholder="选填，简要描述题库内容" class="input" />
              </div>

              <div
                v-if="questionStore.importProgress.status === 'idle' || questionStore.importProgress.status === 'error'"
                class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
                :class="isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-zinc-300 dark:border-zinc-600'"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop="handleDrop"
              >
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                  <Upload class="w-8 h-8 text-zinc-400" />
                </div>
                <p class="text-zinc-700 dark:text-zinc-200 font-medium mb-2">拖拽文件到此处</p>
                <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">支持 Excel (.xlsx, .xls) 和 JSON 格式</p>
                <label class="btn-primary cursor-pointer inline-flex">
                  <FileSpreadsheet class="w-4 h-4 mr-2" />
                  选择文件
                  <input type="file" accept=".xlsx,.xls,.json" class="hidden" @change="handleFileSelect" />
                </label>

                <div v-if="selectedFile" class="mt-4 p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg text-left">
                  <div class="flex items-center gap-3">
                    <FileJson v-if="selectedFile.name.endsWith('.json')" class="w-8 h-8 text-amber-500" />
                    <FileSpreadsheet v-else class="w-8 h-8 text-green-500" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ selectedFile.name }}</div>
                      <div class="text-xs text-zinc-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</div>
                    </div>
                    <button class="text-zinc-400 hover:text-danger-500" @click="selectedFile = null">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="py-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-primary-500 animate-spin" />
                <div class="font-medium text-zinc-700 dark:text-zinc-200">{{ questionStore.importProgress.message }}</div>
                <div v-if="questionStore.importProgress.total > 0" class="mt-2 text-sm text-zinc-500">
                  {{ questionStore.importProgress.current }} / {{ questionStore.importProgress.total }}
                </div>
                <div v-if="questionStore.importProgress.status === 'done'" class="mt-4">
                  <div class="w-16 h-16 mx-auto rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <Check class="w-8 h-8 text-success-600" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="questionStore.importProgress.status === 'idle'" class="flex justify-end gap-3 p-5 border-t border-zinc-200 dark:border-zinc-700">
              <button class="btn-secondary" @click="showImportModal = false; selectedFile = null">取消</button>
              <button class="btn-primary" :disabled="!canImport" @click="startImport">开始导入</button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="showEditModal && editingQuestion" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showEditModal = false">
          <div class="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-2xl shadow-xl animate-slide-up max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-700">
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">修改题目</h3>
              <button class="btn-ghost p-2 -mr-2" @click="showEditModal = false"><X class="w-5 h-5" /></button>
            </div>

            <div class="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题目类型</label>
                <select v-model="editingQuestion.type" class="input">
                  <option v-for="t in questionTypesWithAll.slice(1)" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题目内容</label>
                <textarea v-model="editingQuestion.content" rows="4" class="input resize-none" placeholder="请输入题目内容" />
              </div>

              <div v-if="['single', 'multiple', 'judge'].includes(editingQuestion.type)">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">选项（每行一个）</label>
                <textarea v-model="editOptionStr" rows="6" class="input resize-none font-mono text-sm" placeholder="每行一个选项" />
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                  正确答案
                  <span v-if="editingQuestion.type === 'multiple'" class="text-zinc-400 font-normal">（多选题用字母表示，如 ABC）</span>
                </label>
                <input v-model="editAnswerText" type="text" class="input" placeholder="请输入正确答案" />
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">题目解析</label>
                <textarea v-model="editingQuestion.explanation" rows="3" class="input resize-none" placeholder="请输入题目解析（选填）" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">难度等级</label>
                  <select v-model.number="editingQuestion.difficulty" class="input">
                    <option v-for="n in 5" :key="n" :value="n">{{ n }}星</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 p-5 border-t border-zinc-200 dark:border-zinc-700">
              <button class="btn-secondary" @click="showEditModal = false">取消</button>
              <button class="btn-primary" @click="saveEditQuestion">
                <Check class="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

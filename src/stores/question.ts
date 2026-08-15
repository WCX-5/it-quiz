import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, QuestionType, Tag, ImportProgress, QuestionBank } from '@/types'
import {
  addQuestionsBatch, getQuestionsPaginated, getQuestionsCount, getAllQuestionIds,
  searchQuestions as dbSearchQuestions, getQuestion, deleteQuestion, clearAllQuestions,
  getCategories as dbGetCategories, getTags as dbGetTags, addTag, updateTag as dbUpdateTag, deleteTag as dbDeleteTag,
  getFavorites, getWrongQuestions, addQuestionBank, getQuestionBanks, updateQuestionBank,
  deleteQuestionBank, updateBankQuestionCount, getQuestionIdsByBank, getQuestionBank,
} from '@/composables/useIndexedDB'
import { parseExcelFile, parseJsonFile, exportQuestionsToJson, downloadFile } from '@/utils/questionParser'

export const useQuestionStore = defineStore('question', () => {
  const questions = ref<Question[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(50)
  const loading = ref(false)
  const filterType = ref('')
  const filterCategory = ref('')
  const filterBankId = ref<number | ''>('')
  const categories = ref<string[]>([])
  const tags = ref<Tag[]>([])
  const banks = ref<QuestionBank[]>([])
  const currentBank = ref<QuestionBank | null>(null)
  const importProgress = ref<ImportProgress>({ total: 0, current: 0, status: 'idle', message: '' })
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

  async function loadQuestions(page = 1) {
    loading.value = true
    try {
      currentPage.value = page
      const filters: { type?: string; category?: string; bankId?: number } = {}
      if (filterType.value) filters.type = filterType.value
      if (filterCategory.value) filters.category = filterCategory.value
      if (filterBankId.value !== '') filters.bankId = filterBankId.value as number
      const result = await getQuestionsPaginated(page, pageSize.value, filters)
      questions.value = result.questions; totalCount.value = result.total
    } finally { loading.value = false }
  }

  async function searchQuestions(keyword: string) {
    if (!keyword.trim()) { await loadQuestions(1); return }
    loading.value = true
    try {
      const bankId = filterBankId.value !== '' ? (filterBankId.value as number) : undefined
      const results = await dbSearchQuestions(keyword, pageSize.value, bankId)
      questions.value = results; totalCount.value = results.length
    } finally { loading.value = false }
  }

  async function importFromFile(file: File, bankName: string, bankDesc?: string) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['xlsx', 'xls', 'json'].includes(ext)) throw new Error('不支持的文件格式')
    importProgress.value = { total: 0, current: 0, status: 'parsing', message: '正在解析文件...' }
    try {
      const parsed = ext === 'json' ? await parseJsonFile(file) : await parseExcelFile(file)
      const now = Date.now()
      const bankId = await addQuestionBank({ name: bankName, description: bankDesc || '', questionCount: parsed.length, created_at: now, updated_at: now })
      const qs = parsed.map(q => ({ ...q, bankId }))
      importProgress.value = { total: qs.length, current: 0, status: 'importing', message: '正在导入题库...' }
      for (let i = 0; i < qs.length; i += 100) {
        await addQuestionsBatch(qs.slice(i, i + 100))
        importProgress.value.current = Math.min(i + 100, qs.length)
        importProgress.value.message = `已导入 ${importProgress.value.current}/${importProgress.value.total} 题`
        await new Promise(r => setTimeout(r, 10))
      }
      importProgress.value = { ...importProgress.value, status: 'done', message: `导入完成，共 ${qs.length} 题` }
      await loadBanks(); await loadQuestions(1); await loadCategories()
      return qs.length
    } catch (err) {
      importProgress.value = { ...importProgress.value, status: 'error', message: `导入失败: ${(err as Error).message}` }
      throw err
    }
  }

  const resetImportProgress = () => importProgress.value = { total: 0, current: 0, status: 'idle', message: '' }
  const getQuestionById = (id: number) => getQuestion(id)
  async function getQuestionsByIds(ids: number[]) { return (await Promise.all(ids.map(getQuestion))).filter(Boolean) as Question[] }
  async function getAllIds() { return filterBankId.value !== '' ? getQuestionIdsByBank(filterBankId.value as number) : getAllQuestionIds() }
  const loadCategories = () => dbGetCategories().then(c => categories.value = c)
  const loadTags = () => dbGetTags().then(t => tags.value = t)
  const loadBanks = () => getQuestionBanks().then(b => banks.value = b)
  const loadTotalCount = () => getQuestionsCount().then(c => totalCount.value = c)

  async function addNewTag(tag: Omit<Tag, 'id'>) { const id = await addTag(tag); await loadTags(); return id }
  async function updateTag(tag: Tag) { await dbUpdateTag(tag); await loadTags() }
  async function removeTag(id: number) { await dbDeleteTag(id); await loadTags() }

  async function createBank(name: string, desc?: string) {
    const now = Date.now()
    const id = await addQuestionBank({ name, description: desc || '', questionCount: 0, created_at: now, updated_at: now })
    await loadBanks(); return id
  }
  async function renameBank(id: number, name: string) {
    const bank = await getQuestionBank(id)
    if (bank) { bank.name = name; await updateQuestionBank(bank); await loadBanks() }
  }
  async function removeBank(id: number) {
    await deleteQuestionBank(id); await loadBanks()
    if (filterBankId.value === id) filterBankId.value = ''
    await loadQuestions(1)
  }
  async function removeQuestion(id: number) {
    const q = await getQuestion(id); await deleteQuestion(id)
    if (q?.bankId) { await updateBankQuestionCount(q.bankId); await loadBanks() }
    await loadQuestions(currentPage.value)
  }
  const clearQuestions = () => clearAllQuestions().then(() => { questions.value = []; totalCount.value = 0 })

  async function exportQuestions() {
    const allIds = filterBankId.value !== '' ? await getQuestionIdsByBank(filterBankId.value as number) : await getAllQuestionIds()
    const all = (await Promise.all(allIds.map(getQuestion))).filter(Boolean) as Question[]
    const bankName = filterBankId.value !== '' && currentBank.value ? currentBank.value.name : '全部题库'
    downloadFile(exportQuestionsToJson(all), `${bankName}_备份_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }

  async function getRandomQuestions(count: number) {
    const ids = await getAllIds()
    return [...ids].sort(() => Math.random() - 0.5).slice(0, Math.min(count, ids.length))
  }

  async function getWrongQuestionIds(bankId?: number) {
    let ids = (await getWrongQuestions()).map(w => w.questionId)
    if (bankId !== undefined) { const bankSet = new Set(await getQuestionIdsByBank(bankId)); ids = ids.filter(id => bankSet.has(id)) }
    return ids
  }
  async function getFavoriteQuestionIds(bankId?: number) {
    let ids = (await getFavorites()).map(f => f.questionId)
    if (bankId !== undefined) { const bankSet = new Set(await getQuestionIdsByBank(bankId)); ids = ids.filter(id => bankSet.has(id)) }
    return ids
  }

  async function getQuestionsByType(type: QuestionType, bankId?: number) {
    const filters: { type: string; bankId?: number } = { type }
    if (bankId !== undefined) filters.bankId = bankId
    return (await getQuestionsPaginated(1, 100000, filters)).questions.map(q => q.id!).filter(Boolean) as number[]
  }
  async function getQuestionsByCategory(category: string, bankId?: number) {
    const filters: { category: string; bankId?: number } = { category }
    if (bankId !== undefined) filters.bankId = bankId
    return (await getQuestionsPaginated(1, 100000, filters)).questions.map(q => q.id!).filter(Boolean) as number[]
  }

  return {
    questions, totalCount, currentPage, pageSize, totalPages, loading, filterType, filterCategory,
    filterBankId, categories, tags, banks, currentBank, importProgress,
    loadQuestions, loadTotalCount, searchQuestions, importFromFile, resetImportProgress,
    getQuestionById, getQuestionsByIds, getAllIds, loadCategories, loadTags, loadBanks,
    addNewTag, updateTag, removeTag, createBank, renameBank, removeBank, removeQuestion,
    clearQuestions, exportQuestions, getRandomQuestions, getWrongQuestionIds, getFavoriteQuestionIds,
    getQuestionsByType, getQuestionsByCategory, getQuestionIdsByBank,
  }
})

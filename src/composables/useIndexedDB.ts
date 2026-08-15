import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Question, QuestionBank, PracticeRecord, WrongQuestion, Favorite, Note, DailyStat, Tag } from '@/types'

interface QuizDB extends DBSchema {
  questionBanks: { key: number; value: QuestionBank; indexes: { 'by-name': string; 'by-created_at': number } }
  questions: { key: number; value: Question; indexes: { 'by-type': string; 'by-category': string; 'by-difficulty': number; 'by-bankId': number } }
  practiceRecords: { key: number; value: PracticeRecord; indexes: { 'by-questionId': number; 'by-timestamp': number } }
  wrongQuestions: { key: number; value: WrongQuestion; indexes: { 'by-wrongCount': number; 'by-lastWrongTime': number } }
  favorites: { key: number; value: Favorite; indexes: { 'by-timestamp': number } }
  notes: { key: number; value: Note; indexes: { 'by-updated_at': number } }
  dailyStats: { key: string; value: DailyStat; indexes: { 'by-totalCount': number } }
  tags: { key: number; value: Tag; indexes: { 'by-name': string } }
}

const DB_NAME = 'it_quiz_db'
const DB_VERSION = 3
let dbPromise: Promise<IDBPDatabase<QuizDB>> | null = null

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o))

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<QuizDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains('questions')) {
          const s = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true })
          s.createIndex('by-type', 'type'); s.createIndex('by-category', 'category')
          s.createIndex('by-difficulty', 'difficulty'); s.createIndex('by-bankId', 'bankId')
        } else if (oldVersion < 2) {
          const s = transaction.objectStore('questions')
          if (!s.indexNames.contains('by-bankId')) s.createIndex('by-bankId', 'bankId')
        }
        if (!db.objectStoreNames.contains('questionBanks')) {
          const s = db.createObjectStore('questionBanks', { keyPath: 'id', autoIncrement: true })
          s.createIndex('by-name', 'name', { unique: true }); s.createIndex('by-created_at', 'created_at')
          const now = Date.now()
          const seed = [
            { name: 'web题库', description: 'Web前端基础题库', questionCount: 40 },
            { name: 'web前端', description: 'Web前端进阶题库', questionCount: 60 },
            { name: '算法题库', description: '算法与数据结构', questionCount: 35 },
            { name: '数据库', description: 'SQL数据库题库', questionCount: 30 },
            { name: '网络基础', description: '计算机网络基础', questionCount: 25 },
            { name: '操作系统', description: '操作系统原理', questionCount: 20 },
          ]
          seed.forEach((b, i) => s.add({ ...b, created_at: now - i * 1000, updated_at: now }))
        }
        if (!db.objectStoreNames.contains('practiceRecords')) {
          const s = db.createObjectStore('practiceRecords', { keyPath: 'id', autoIncrement: true })
          s.createIndex('by-questionId', 'questionId'); s.createIndex('by-timestamp', 'timestamp')
        }
        if (!db.objectStoreNames.contains('wrongQuestions')) {
          const s = db.createObjectStore('wrongQuestions', { keyPath: 'questionId' })
          s.createIndex('by-wrongCount', 'wrongCount'); s.createIndex('by-lastWrongTime', 'lastWrongTime')
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'questionId' }).createIndex('by-timestamp', 'timestamp')
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'questionId' }).createIndex('by-updated_at', 'updated_at')
        }
        if (!db.objectStoreNames.contains('dailyStats')) {
          db.createObjectStore('dailyStats', { keyPath: 'date' }).createIndex('by-totalCount', 'totalCount')
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true }).createIndex('by-name', 'name', { unique: true })
        }
      },
    })
  }
  return dbPromise
}

const getDB = () => initDB()

// Questions
export const addQuestion = (q: Omit<Question, 'id'>) => getDB().then(db => db.add('questions', clone(q as Question)))
export async function addQuestionsBatch(questions: Omit<Question, 'id'>[]): Promise<number[]> {
  const db = await getDB()
  const tx = db.transaction('questions', 'readwrite')
  const ids = await Promise.all(questions.map(q => tx.store.add(clone(q as Question))))
  await tx.done
  return ids as number[]
}
export const getQuestion = (id: number) => getDB().then(db => db.get('questions', id))
export const getAllQuestionIds = () => getDB().then(db => db.getAllKeys('questions')).then(k => k as number[])
export const getQuestionsCount = () => getDB().then(db => db.count('questions'))
export const updateQuestion = (q: Question) => getDB().then(db => db.put('questions', clone(q)))
export const deleteQuestion = (id: number) => getDB().then(db => db.delete('questions', id))
export const clearAllQuestions = () => getDB().then(db => db.clear('questions'))

export async function getQuestionsPaginated(page: number, pageSize: number, filters?: { type?: string; category?: string; difficulty?: number; bankId?: number }) {
  const db = await getDB()
  let all: Question[]
  if (filters?.bankId !== undefined) all = await db.getAllFromIndex('questions', 'by-bankId', filters.bankId)
  else if (filters?.type) all = await db.getAllFromIndex('questions', 'by-type', filters.type)
  else if (filters?.category) all = await db.getAllFromIndex('questions', 'by-category', filters.category)
  else if (filters?.difficulty) all = await db.getAllFromIndex('questions', 'by-difficulty', filters.difficulty)
  else all = await db.getAll('questions')

  if (filters?.bankId !== undefined) {
    if (filters.type) all = all.filter(q => q.type === filters.type)
    if (filters.category) all = all.filter(q => q.category === filters.category)
  }
  return { questions: all.slice((page - 1) * pageSize, page * pageSize), total: all.length }
}

export const getQuestionIdsByBank = (bankId: number) => getDB().then(db => db.getAllKeysFromIndex('questions', 'by-bankId', bankId)).then(k => k as number[])

export async function searchQuestions(keyword: string, limit = 100, bankId?: number): Promise<Question[]> {
  const db = await getDB()
  const all = bankId !== undefined ? await db.getAllFromIndex('questions', 'by-bankId', bankId) : await db.getAll('questions')
  const kw = keyword.toLowerCase()
  return all.filter(q => q.content.toLowerCase().includes(kw) || q.explanation?.toLowerCase().includes(kw) || q.tags?.some(t => t.toLowerCase().includes(kw))).slice(0, limit)
}

// Question Banks
export const addQuestionBank = (bank: Omit<QuestionBank, 'id'>) => getDB().then(db => db.add('questionBanks', clone(bank as QuestionBank)))
export const getQuestionBanks = () => getDB().then(async db => (await db.getAll('questionBanks')).sort((a, b) => b.created_at - a.created_at))
export const getQuestionBank = (id: number) => getDB().then(db => db.get('questionBanks', id))
export async function updateQuestionBank(bank: QuestionBank) { bank.updated_at = Date.now(); (await getDB()).put('questionBanks', clone(bank)) }
export async function deleteQuestionBank(id: number) {
  const db = await getDB()
  const tx = db.transaction(['questionBanks', 'questions'], 'readwrite')
  await tx.objectStore('questionBanks').delete(id)
  const qs = await tx.objectStore('questions').index('by-bankId').getAll(id)
  for (const q of qs) await tx.objectStore('questions').delete(q.id!)
  await tx.done
}
export async function updateBankQuestionCount(bankId: number) {
  const db = await getDB()
  const count = await db.countFromIndex('questions', 'by-bankId', bankId)
  const bank = await db.get('questionBanks', bankId)
  if (bank) { bank.questionCount = count; bank.updated_at = Date.now(); await db.put('questionBanks', clone(bank)) }
}

// Practice Records
export const addPracticeRecord = (r: Omit<PracticeRecord, 'id'>) => getDB().then(db => db.add('practiceRecords', clone(r as PracticeRecord)))
export const getPracticeRecordsByQuestion = (qid: number) => getDB().then(db => db.getAllFromIndex('practiceRecords', 'by-questionId', qid))
export const getPracticeRecordsCount = () => getDB().then(db => db.count('practiceRecords'))

// Wrong Questions
export async function addWrongQuestion(wrong: WrongQuestion) {
  const db = await getDB()
  const ex = await db.get('wrongQuestions', wrong.questionId)
  if (ex) { ex.wrongCount++; ex.lastWrongAnswer = wrong.lastWrongAnswer; ex.lastWrongTime = wrong.lastWrongTime; await db.put('wrongQuestions', clone(ex)) }
  else await db.put('wrongQuestions', clone(wrong))
}
export const removeWrongQuestion = (qid: number) => getDB().then(db => db.delete('wrongQuestions', qid))
export const getWrongQuestions = () => getDB().then(db => db.getAll('wrongQuestions'))
export const getWrongQuestionsCount = () => getDB().then(db => db.count('wrongQuestions'))

// Favorites
export const addFavorite = (f: Favorite) => getDB().then(db => db.put('favorites', clone(f)))
export const removeFavorite = (qid: number) => getDB().then(db => db.delete('favorites', qid))
export const isFavorite = async (qid: number) => !!(await (await getDB()).get('favorites', qid))
export const getFavorites = () => getDB().then(db => db.getAll('favorites'))
export const getFavoritesCount = () => getDB().then(db => db.count('favorites'))

// Notes
export const saveNote = (note: Note) => getDB().then(db => db.put('notes', clone(note)))
export const getNote = (qid: number) => getDB().then(db => db.get('notes', qid))

// Daily Stats
export const getDailyStat = (date: string) => getDB().then(db => db.get('dailyStats', date))
export const saveDailyStat = (stat: DailyStat) => getDB().then(db => db.put('dailyStats', clone(stat)))
export const getDailyStats = () => getDB().then(db => db.getAll('dailyStats'))

// Tags
export const getTags = () => getDB().then(db => db.getAll('tags'))
export const addTag = (tag: Omit<Tag, 'id'>) => getDB().then(db => db.add('tags', clone(tag as Tag)))
export const updateTag = (tag: Tag) => getDB().then(db => db.put('tags', clone(tag)))
export const deleteTag = (id: number) => getDB().then(db => db.delete('tags', id))

// Categories
export async function getCategories(): Promise<string[]> {
  const all = await (await getDB()).getAll('questions')
  return [...new Set(all.filter(q => q.category).map(q => q.category))]
}

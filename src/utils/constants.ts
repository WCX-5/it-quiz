import type { QuestionType, Question } from '@/types'
import type { Component } from 'vue'
import { Home, BookOpen, FileText, Database, Settings, XCircle, Star, BarChart3, TrendingUp, Target, Award } from 'lucide-vue-next'

interface StatCard { label: string; key: string; icon: Component; color: string; gradient: string; suffix?: string }

export const typeNameMap: Record<string, string> = {
  single: '单选题', multiple: '多选题', judge: '判断题', short: '简答题', program: '编程题',
}

export const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'short', label: '简答题' },
  { value: 'program', label: '编程题' },
]

export const questionTypesWithAll = [{ value: '', label: '全部题型' }, ...questionTypes]

export const typeTagClass: Record<string, string> = {
  single: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  multiple: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  judge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  short: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  program: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
}

export const navItems = [
  { path: '/', name: '首页', icon: Home },
  { path: '/practice', name: '刷题', icon: BookOpen },
  { path: '/exam', name: '考试', icon: FileText },
  { path: '/questions', name: '题库', icon: Database },
  { path: '/settings', name: '设置', icon: Settings },
  { path: '/wrong', name: '错题', icon: XCircle },
  { path: '/favorites', name: '收藏', icon: Star },
  { path: '/stats', name: '统计', icon: BarChart3 },
]

// 底部 Tab 导航 5 项：首页/刷题/考试/题库/设置（剩余入口在移动端侧边栏抽屉可达）
export const navItemsBottom = navItems.slice(0, 5)

export const isActivePath = (path: string, current: string) =>
  path === '/' ? current === '/' : current.startsWith(path)

export const pageTitleMap: Record<string, string> = {
  '/': '首页', '/practice': '刷题练习', '/exam': '模拟考试', '/questions': '题库管理',
  '/wrong': '错题本', '/favorites': '我的收藏', '/stats': '数据统计', '/settings': '设置',
}

export const statCards: StatCard[] = [
  { label: '总题数', key: 'totalQuestions', icon: BookOpen, color: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' },
  { label: '已练习', key: 'practicedCount', icon: Target, color: 'text-green-500', gradient: 'from-green-500 to-green-600' },
  { label: '正确率', key: 'correctRate', icon: TrendingUp, color: 'text-purple-500', gradient: 'from-purple-500 to-purple-600', suffix: '%' },
  { label: '连续打卡', key: 'streakDays', icon: Award, color: 'text-amber-500', gradient: 'from-amber-500 to-amber-600', suffix: '天' },
]

export const getStatValue = (key: string, store: { correctRate: number; totalQuestions: number; practicedCount: number; streakDays: number }) => {
  if (key === 'correctRate') return store.correctRate
  if (key === 'totalQuestions') return store.totalQuestions
  if (key === 'practicedCount') return store.practicedCount
  if (key === 'streakDays') return store.streakDays
  return 0
}

export function isAnswerCorrect(type: QuestionType, userAns: string | string[], correctAns: string | string[]): boolean {
  const u = userAns as string
  if (type === 'single' || type === 'judge') return u.toUpperCase() === (correctAns as string).toUpperCase()
  if (type === 'multiple') return JSON.stringify(u.toUpperCase().split('').sort()) === JSON.stringify((correctAns as string[]).map(a => a.toUpperCase()).sort())
  return u.trim() === (correctAns as string).trim()
}

export function formatAnswer(q: { type: QuestionType; answer: string | string[] }): string {
  return q.type === 'multiple' ? (q.answer as string[]).join('、') : q.answer as string
}

export const truncate = (text: string, max = 80) => text.length <= max ? text : text.slice(0, max) + '...'

export const difficultyStars = (d: number) => '★'.repeat(d) + '☆'.repeat(5 - d)

export const formatTime = (t: number) => {
  const d = new Date(t)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5)
}

export const hasUserAnswer = (a: string | string[]) => typeof a === 'string' ? a.trim().length > 0 : a.length > 0

export function formatShortcut(code: string): string {
  const map: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Enter: 'Enter', Space: 'Space', Escape: 'Esc', Backspace: '⌫', Tab: 'Tab' }
  if (map[code]) return map[code]
  if (code.startsWith('Key')) return code.replace('Key', '')
  if (code.startsWith('Digit')) return code.replace('Digit', '')
  return code
}

export const isCorrectOption = (q: Pick<Question, 'type' | 'answer'>, idx: number) => {
  const letter = String.fromCharCode(65 + idx)
  if (q.type === 'single' || q.type === 'judge') return (q.answer as string).toUpperCase() === letter
  if (q.type === 'multiple') return (q.answer as string[]).map(a => a.toUpperCase()).includes(letter)
  return false
}

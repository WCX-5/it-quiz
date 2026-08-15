export type QuestionType = 'single' | 'multiple' | 'judge' | 'short' | 'program'
export type PracticeMode = 'sequential' | 'random' | 'category' | 'wrong' | 'favorite'

export interface QuestionBank { id?: number; name: string; description?: string; questionCount: number; created_at: number; updated_at: number }
export interface Question { id?: number; bankId?: number; type: QuestionType; content: string; options: string[]; answer: string | string[]; explanation: string; tags: string[]; category: string; difficulty: number; codeTemplate?: string; language?: string; created_at: number }
export interface PracticeRecord { id?: number; questionId: number; isCorrect: boolean; userAnswer: string | string[]; timeSpent: number; timestamp: number }
export interface WrongQuestion { questionId: number; wrongCount: number; lastWrongAnswer: string | string[]; lastWrongTime: number }
export interface Favorite { questionId: number; timestamp: number }
export interface Note { questionId: number; content: string; updated_at: number }
export interface DailyStat { date: string; totalCount: number; correctCount: number; timeSpent: number }
export interface Tag { id?: number; name: string; color: string; count: number }

export interface UserConfig {
  theme: 'light' | 'dark'; fontSize: number; shortcuts: Record<string, string>
  lastPosition: { mode: PracticeMode; questionId: number | null; index: number } | null
}

export interface ExamConfig { questionCount: number; duration: number; types: string[]; bankIds: number[]; difficultyRange: [number, number] }
export interface ImportProgress { total: number; current: number; status: 'idle' | 'parsing' | 'importing' | 'done' | 'error'; message: string }

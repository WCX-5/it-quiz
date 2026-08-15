import * as XLSX from 'xlsx'
import type { Question, QuestionType } from '@/types'

function detectType(row: Record<string, unknown>): QuestionType {
  const type = String(row['题型'] || row['type'] || '').toLowerCase()
  if (type.includes('单选') || type === 'single') return 'single'
  if (type.includes('多选') || type === 'multiple') return 'multiple'
  if (type.includes('判断') || type === 'judge') return 'judge'
  if (type.includes('简答') || type === 'short') return 'short'
  if (type.includes('编程') || type === 'program' || type === 'code') return 'program'
  const answer = String(row['答案'] || row['answer'] || '')
  if (['正确', '错误', '对', '错', '√', '×'].includes(answer) || ['true', 'false'].includes(answer.toLowerCase())) return 'judge'
  const options = extractOptions(row)
  if (options.length >= 2 && /^[A-Z]+$/.test(answer.toUpperCase().replace(/\s/g, ''))) return answer.length === 1 ? 'single' : 'multiple'
  return options.length >= 2 ? 'single' : 'short'
}

export function extractOptions(row: Record<string, unknown>): string[] {
  const options: string[] = []
  for (const key of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    const val = row[key] || row[`选项${key}`] || row[`option${key}`]
    if (val != null && String(val).trim()) options.push(String(val).trim())
  }
  const field = row['选项'] || row['options']
  if (field) {
    try {
      const parsed = JSON.parse(String(field))
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      const lines = String(field).split(/[\n;；]/).filter(s => s.trim())
      if (lines.length) return lines.map(l => l.replace(/^[A-Z][.．、\)]\s*/, '').trim())
    }
  }
  return options
}

function normalizeAnswer(answer: string, type: QuestionType): string | string[] {
  const t = answer.trim()
  if (type === 'single') return t.toUpperCase().replace(/\s/g, '').charAt(0)
  if (type === 'multiple') return t.toUpperCase().replace(/[\s,，、;；]/g, '').split('').sort()
  if (type === 'judge') return ['正确', '对', '√', 'true', 't', 'yes', 'y', '是'].includes(t.toLowerCase()) ? '正确' : '错误'
  return t
}

function buildQuestion(row: Record<string, unknown>, ts: number): Question | null {
  const content = String(row['题目'] || row['题干'] || row['content'] || row['question'] || '').trim()
  if (!content) return null
  const type = detectType(row)
  const options = type === 'judge' ? ['正确', '错误'] : extractOptions(row)
  const answer = normalizeAnswer(String(row['答案'] || row['answer'] || ''), type)
  const tagsStr = String(row['标签'] || row['tags'] || row['知识点'] || '')
  return {
    type, content, options, answer,
    explanation: String(row['解析'] || row['explanation'] || '').trim(),
    tags: tagsStr ? tagsStr.split(/[,，;；\n]/).map(t => t.trim()).filter(Boolean) : [],
    category: String(row['分类'] || row['category'] || row['章节'] || '默认分类').trim(),
    difficulty: Math.min(5, Math.max(1, Number(row['难度'] || row['difficulty'] || 3) || 3)),
    codeTemplate: type === 'program' ? String(row['代码模板'] || row['codeTemplate'] || '') : undefined,
    language: type === 'program' ? String(row['语言'] || row['language'] || 'javascript').trim() : undefined,
    created_at: ts,
  }
}

function readFile(file: File, asText = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(reader.error)
    asText ? reader.readAsText(file) : reader.readAsBinaryString(file)
  })
}

export async function parseExcelFile(file: File): Promise<Question[]> {
  const data = await readFile(file)
  const wb = XLSX.read(data, { type: 'binary' })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as Record<string, unknown>[]
  const now = Date.now()
  return rows.map((r, i) => buildQuestion(r, now + i)).filter(Boolean) as Question[]
}

export async function parseJsonFile(file: File): Promise<Question[]> {
  const data = JSON.parse(await readFile(file, true))
  const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.questions || [])
  const now = Date.now()
  return items.map((item, i) => buildQuestion(item, now + i)).filter(q => q && q.content) as Question[]
}

export const exportQuestionsToJson = (questions: Question[]) => JSON.stringify({
  version: '1.0', exportTime: new Date().toISOString(), count: questions.length, questions,
}, null, 2)

export function downloadFile(content: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

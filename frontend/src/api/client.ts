import type { SolveMetadata, PracticeProblem, PracticeGradeResult, PracticeTopic } from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function* streamSolve(
  problem: string,
  onMetadata: (meta: SolveMetadata) => void,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/api/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return
      try {
        const parsed = JSON.parse(raw)
        if (parsed.type === 'metadata') {
          onMetadata(parsed as SolveMetadata)
        } else if (parsed.type === 'text') {
          yield parsed.content as string
        }
      } catch {
        // partial JSON — skip
      }
    }
  }
}

export async function generatePractice(
  topic: PracticeTopic,
  difficulty: 'easy' | 'medium' | 'hard',
  weakAreas: string[] = [],
): Promise<PracticeProblem> {
  const res = await fetch(`${BASE}/api/practice/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, weak_areas: weakAreas }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function* streamGrade(
  problem: string,
  problemId: string,
  studentAnswer: string,
  correctAnswer: string,
  topic: string,
  onMetadata: (grade: PracticeGradeResult) => void,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/api/practice/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_id: problemId,
      problem,
      student_answer: studentAnswer,
      correct_answer: correctAnswer,
      topic,
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return
      try {
        const parsed = JSON.parse(raw)
        if (parsed.type === 'metadata') {
          onMetadata(parsed.grade as PracticeGradeResult)
        } else if (parsed.type === 'text') {
          yield parsed.content as string
        }
      } catch { /* skip */ }
    }
  }
}

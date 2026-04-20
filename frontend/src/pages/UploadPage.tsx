import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPrompt } from '../api/prompts'
import type { PromptType, TargetRole } from '../types'

const MAX_BYTES = 50 * 1024

const TYPE_OPTIONS: { label: string; value: PromptType }[] = [
  { label: 'CLAUDE.md', value: 'CLAUDE_MD' },
  { label: 'Agent', value: 'AGENT' },
  { label: 'Skill', value: 'SKILL' },
  { label: 'Settings', value: 'SETTINGS' },
  { label: 'Bundle', value: 'BUNDLE' },
]

const ROLE_OPTIONS: { label: string; value: TargetRole }[] = [
  { label: '개발자', value: 'DEVELOPER' },
  { label: '기획자', value: 'PLANNER' },
  { label: '디자이너', value: 'DESIGNER' },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<PromptType>('CLAUDE_MD')
  const [targetRole, setTargetRole] = useState<TargetRole | undefined>()
  const [price, setPrice] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contentBytes = new TextEncoder().encode(content).length
  const isOverLimit = contentBytes > MAX_BYTES

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isOverLimit) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createPrompt({ title, description, content, type, targetRole, price, tags })
      navigate(`/prompts/${created.id}`)
    } catch {
      setError('등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-white mb-6">프롬프트 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">제목</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
              placeholder="프롬프트 제목"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">설명</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
              placeholder="프롬프트에 대한 설명"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">내용</label>
              <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-neutral-500'}`}>
                {contentBytes.toLocaleString()} / {MAX_BYTES.toLocaleString()} bytes
              </span>
            </div>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full rounded-lg bg-[#0d0d0d] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
              placeholder="프롬프트 내용을 입력하세요..."
            />
            {isOverLimit && (
              <p className="mt-1 text-xs text-red-500">50KB 한도를 초과했습니다.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">타입</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PromptType)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">대상 역할</label>
              <select
                value={targetRole ?? ''}
                onChange={(e) => setTargetRole((e.target.value as TargetRole) || undefined)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                <option value="">전체</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">가격 (0 = 무료)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">태그</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
              placeholder="Enter 또는 쉼표로 태그 추가"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full bg-neutral-800 text-neutral-400 px-2 py-0.5 text-xs hover:bg-neutral-700 transition-colors"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isOverLimit}
            className="w-full rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

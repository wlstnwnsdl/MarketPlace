import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPrompt } from '../api/prompts'
import Header from '../components/Header'
import type { PromptType, TargetRole } from '../types'

const MAX_BYTES = 51200

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
  const usagePercent = Math.min((contentBytes / MAX_BYTES) * 100, 100)

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
    if (isOverLimit || !title || !content || !type) return
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

  const inputClass = 'w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 bg-white transition-colors'
  const labelClass = 'text-sm font-medium text-zinc-700 mb-1.5 block'

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">프롬프트 등록</h1>

        <div className="mp-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className={labelClass}>제목 *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="프롬프트 제목"
              />
            </div>

            {/* 타입 / 역할 / 가격 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>타입 *</label>
                <div className="flex flex-wrap gap-1">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={type === opt.value ? 'mp-tab-active text-xs px-2.5 py-1' : 'mp-tab-inactive text-xs px-2.5 py-1'}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>역할</label>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetRole(undefined)}
                    className={targetRole === undefined ? 'mp-tab-active text-xs px-2.5 py-1' : 'mp-tab-inactive text-xs px-2.5 py-1'}
                  >
                    전체
                  </button>
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTargetRole(opt.value)}
                      className={targetRole === opt.value ? 'mp-tab-active text-xs px-2.5 py-1' : 'mp-tab-inactive text-xs px-2.5 py-1'}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>가격 (0 = 무료)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₩</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={inputClass + ' pl-8'}
                  />
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClass + ' resize-none'}
                placeholder="프롬프트에 대한 설명"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-zinc-700">프롬프트 내용 * (50KB 이하)</label>
                <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-zinc-400'}`}>
                  {contentBytes.toLocaleString()} bytes
                </span>
              </div>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className={inputClass + ' font-mono resize-none h-64'}
                placeholder="프롬프트 내용을 입력하세요..."
              />
              <div className="mt-2">
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : 'bg-zinc-900'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 mt-1 block">
                  {contentBytes.toLocaleString()} / {MAX_BYTES.toLocaleString()} bytes · {Math.round(usagePercent)}% 사용
                </span>
              </div>
              {isOverLimit && (
                <p className="mt-1 text-xs text-red-500">50KB 한도를 초과했습니다.</p>
              )}
            </div>

            {/* 태그 */}
            <div>
              <label className={labelClass}>태그 (엔터로 추가)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className={inputClass}
                placeholder="Enter 또는 쉼표로 태그 추가"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-zinc-400 hover:text-zinc-600 ml-1 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* 버튼 */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors px-4 py-2"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!title || !content || isOverLimit || !type || submitting}
                className="mp-btn-terminal px-8 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '> marketplace publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

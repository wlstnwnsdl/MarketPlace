import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPrompt, getPrompt, updatePrompt } from '../api/prompts'
import Header from '../components/Header'
import type { PromptStatus, PromptType, TargetRole } from '../types'

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
  { label: 'PM', value: 'PM' },
  { label: '마케터', value: 'MARKETER' },
  { label: '영업', value: 'SALES' },
]

const STATUS_OPTIONS: { label: string; value: PromptStatus }[] = [
  { label: '대기', value: 'PENDING' },
  { label: '공개', value: 'PUBLIC' },
  { label: '미공개', value: 'PRIVATE' },
]

const STATUS_CLASSES: Record<PromptStatus, { active: string; inactive: string }> = {
  PENDING: {
    active: 'text-xs px-2.5 py-1 rounded-full font-medium bg-amber-400 text-white',
    inactive: 'text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors',
  },
  PUBLIC: {
    active: 'text-xs px-2.5 py-1 rounded-full font-medium bg-green-500 text-white',
    inactive: 'text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors',
  },
  PRIVATE: {
    active: 'text-xs px-2.5 py-1 rounded-full font-medium bg-red-500 text-white',
    inactive: 'text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors',
  },
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<PromptType>('CLAUDE_MD')
  const [targetRole, setTargetRole] = useState<TargetRole | undefined>()
  const [price, setPrice] = useState(0)
  const [priceDisplay, setPriceDisplay] = useState('0')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<PromptStatus>('PENDING')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(isEdit)

  // Edit 모드: 기존 데이터 로드
  useEffect(() => {
    if (!isEdit) return
    setLoadingEdit(true)
    getPrompt(Number(id))
      .then((prompt) => {
        setTitle(prompt.title)
        setDescription(prompt.description ?? '')
        setContent(prompt.content ?? '')
        setType(prompt.type)
        setTargetRole(prompt.targetRole ?? undefined)
        setPrice(prompt.price)
        setPriceDisplay(prompt.price.toLocaleString('ko-KR'))
        setTags(prompt.tags)
        setStatus(prompt.status)
      })
      .catch(() => setError('프롬프트를 불러올 수 없습니다.'))
      .finally(() => setLoadingEdit(false))
  }, [id, isEdit])

  const contentBytes = new TextEncoder().encode(content).length
  const isOverLimit = contentBytes > MAX_BYTES
  const usagePercent = Math.min((contentBytes / MAX_BYTES) * 100, 100)

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setPrice(0)
      setPriceDisplay('0')
      return
    }
    const num = Number(raw)
    setPrice(num)
    setPriceDisplay(num.toLocaleString('ko-KR'))
  }

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
      if (isEdit) {
        const updated = await updatePrompt(Number(id), {
          title,
          description,
          content,
          type,
          targetRole,
          price,
          tags,
          status,
        })
        navigate(`/prompts/${updated.id}`)
      } else {
        const created = await createPrompt({ title, description, content, type, targetRole, price, tags, status })
        navigate(`/prompts/${created.id}`)
      }
    } catch {
      setError(isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 bg-white transition-colors'
  const labelClass = 'text-sm font-medium text-zinc-700 mb-1.5 block'

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-zinc-200 rounded w-40" />
            <div className="h-64 bg-zinc-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">
          {isEdit ? '프롬프트 수정' : '프롬프트 등록'}
        </h1>

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
                    type="text"
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    className={inputClass + ' pl-8'}
                  />
                </div>
              </div>
            </div>

            {/* 공개 상태 */}
            <div>
              <label className={labelClass}>공개 상태</label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={STATUS_CLASSES[opt.value][status === opt.value ? 'active' : 'inactive']}
                  >
                    {opt.label}
                  </button>
                ))}
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
                className={inputClass + ' resize-none h-64'}
                placeholder="프롬프트 내용을 입력하세요..."
              />
              <div className="mt-2">
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : 'bg-[#4D61E6]'}`}
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
                {submitting
                  ? (isEdit ? '수정 중...' : '등록 중...')
                  : (isEdit ? '수정 저장' : '배포하기')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

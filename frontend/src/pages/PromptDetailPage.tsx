import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import client from '../api/client'
import { getPrompt } from '../api/prompts'
import { purchasePrompt } from '../api/purchases'
import Header from '../components/Header'
import PromptPreview from '../components/PromptPreview'
import TagBadge from '../components/TagBadge'
import type { PromptDetail, PromptType, TargetRole } from '../types'

const TYPE_LABEL: Record<PromptType, string> = {
  CLAUDE_MD: 'CLAUDE.md',
  AGENT: 'Agent',
  SKILL: 'Skill',
  SETTINGS: 'Settings',
  BUNDLE: 'Bundle',
}

const ROLE_LABEL: Record<TargetRole, string> = {
  DEVELOPER: '개발자',
  PLANNER: '기획자',
  DESIGNER: '디자이너',
  PM: 'PM',
  MARKETER: '마케터',
  SALES: '영업',
}

interface TypeConfig {
  bg: string
  icon: JSX.Element
}

const TYPE_CONFIG: Record<PromptType, TypeConfig> = {
  CLAUDE_MD: {
    bg: 'bg-amber-50',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  AGENT: {
    bg: 'bg-blue-50',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
  SKILL: {
    bg: 'bg-green-50',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  SETTINGS: {
    bg: 'bg-zinc-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  BUNDLE: {
    bg: 'bg-purple-50',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 3H8l-2 4h12z" />
      </svg>
    ),
  },
}

function getCurrentUserId(): number | null {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ? Number(payload.sub) : null
  } catch {
    return null
  }
}

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLoggedIn = !!localStorage.getItem('accessToken')
  const currentUserId = getCurrentUserId()

  const fetchPrompt = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getPrompt(Number(id))
      setPrompt(data)
    } catch {
      setError('프롬프트를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompt()
  }, [id])

  const handlePurchase = async () => {
    if (!id) return
    setPurchasing(true)
    setError(null)
    try {
      await purchasePrompt(Number(id))
      await fetchPrompt()
    } catch {
      setError('구매에 실패했습니다.')
    } finally {
      setPurchasing(false)
    }
  }

  const handleDownload = async () => {
    if (!id || !prompt) return
    setDownloading(true)
    setError(null)
    try {
      const { data } = await client.get<Blob>(`/prompts/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${prompt.title.replace(/\s+/g, '-')}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('다운로드에 실패했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-200 rounded w-24" />
            <div className="h-8 bg-zinc-200 rounded w-1/2" />
            <div className="flex gap-8 mt-6">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-zinc-200 rounded" />
                <div className="h-4 bg-zinc-200 rounded w-4/5" />
                <div className="h-40 bg-zinc-200 rounded" />
              </div>
              <div className="w-80 h-48 bg-zinc-200 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error && !prompt) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
          <p className="text-red-500 text-sm">{error ?? '프롬프트를 찾을 수 없습니다.'}</p>
        </main>
      </div>
    )
  }

  if (!prompt) return null

  const typeConfig = TYPE_CONFIG[prompt.type]
  const isOwner = currentUserId !== null && prompt.sellerId === currentUserId

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          ← 목록으로
        </button>

        {/* 프롬프트 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
              {typeConfig.icon}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{prompt.title}</h1>
              <p className="text-sm text-zinc-400 mt-1">
                {TYPE_LABEL[prompt.type]}
                {prompt.targetRole && ` · ${ROLE_LABEL[prompt.targetRole]}`}
                {` · ${prompt.downloadCount}회 다운로드`}
              </p>
              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {prompt.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
              )}
            </div>
          </div>

          <span className={prompt.price === 0 ? 'mp-badge-free' : 'mp-badge-paid'}>
            {prompt.price === 0 ? 'Free' : `₩${prompt.price.toLocaleString()}`}
          </span>
        </div>

        {/* 좌우 2단 레이아웃 */}
        <div className="flex gap-8">
          {/* 좌측 — 설명 + 미리보기 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-600 leading-relaxed">{prompt.description}</p>

            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-6 mb-3">미리보기</h2>
            <PromptPreview
              content={prompt.previewContent || (prompt.purchased && prompt.content ? prompt.content : '') || ''}
              purchased={prompt.purchased}
            />

            {prompt.purchased && prompt.content && (
              <>
                <hr className="border-zinc-200 my-6" />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">전체 내용</h2>
                <PromptPreview content={prompt.content} purchased />
              </>
            )}
          </div>

          {/* 우측 — 구매 패널 */}
          <div className="w-80 shrink-0">
            <div className="mp-card p-6 sticky top-6">
              <div className="text-2xl font-bold text-zinc-900 mb-1">
                {prompt.price === 0 ? '무료' : `₩${prompt.price.toLocaleString()}`}
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                {prompt.price === 0 ? '로그인 후 바로 다운로드' : '구매 후 영구 이용 가능'}
              </p>

              {!isLoggedIn && (
                <button
                  onClick={() => navigate('/login')}
                  className="mp-btn-terminal w-full justify-center"
                >
                  로그인하고 받기
                </button>
              )}

              {isLoggedIn && !prompt.purchased && !isOwner && (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="mp-btn-terminal w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? '처리 중...' : (prompt.price === 0 ? '무료로 받기' : '구매하기')}
                </button>
              )}

              {prompt.purchased && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mp-btn-terminal w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? '다운로드 중...' : '다운로드'}
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => navigate(`/edit/${prompt.id}`)}
                  className="w-full mt-3 text-sm text-zinc-600 border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-colors"
                >
                  수정하기
                </button>
              )}

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

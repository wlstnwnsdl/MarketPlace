import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadPrompt, getPrompt } from '../api/prompts'
import { purchasePrompt } from '../api/purchases'
import PromptPreview from '../components/PromptPreview'
import TagBadge from '../components/TagBadge'
import type { PromptDetail, PromptType } from '../types'

const TYPE_LABEL: Record<PromptType, string> = {
  CLAUDE_MD: 'CLAUDE.md',
  AGENT: 'Agent',
  SKILL: 'Skill',
  SETTINGS: 'Settings',
  BUNDLE: 'Bundle',
}

const TYPE_BADGE: Record<PromptType, string> = {
  CLAUDE_MD: 'bg-amber-900/20 text-amber-400 border border-amber-900',
  AGENT: 'bg-blue-900/20 text-blue-400 border border-blue-900',
  SKILL: 'bg-green-900/20 text-green-400 border border-green-900',
  SETTINGS: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
  BUNDLE: 'bg-purple-900/20 text-purple-400 border border-purple-900',
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
    if (!currentUserId) {
      navigate('/login')
      return
    }
    if (!id) return
    setPurchasing(true)
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
    if (!id) return
    setDownloading(true)
    try {
      await downloadPrompt(Number(id))
    } catch {
      setError('다운로드에 실패했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-neutral-500">로딩 중...</p>
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-red-500">{error ?? '프롬프트를 찾을 수 없습니다.'}</p>
      </div>
    )
  }

  const isSeller = currentUserId !== null && prompt.sellerId === currentUserId

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm mb-6"
        >
          ← 목록으로
        </button>

        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[prompt.type]}`}>
                {TYPE_LABEL[prompt.type]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{prompt.title}</h1>
            <p className="text-neutral-300">{prompt.description}</p>

            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prompt.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}

            <div className="text-xs text-neutral-500">
              판매자 ID: {prompt.sellerId} · {new Date(prompt.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>

          <div className="w-80 shrink-0 space-y-4">
            <div className="rounded-lg bg-[#141414] border border-neutral-800 p-4 space-y-4">
              <div className="text-lg font-semibold text-amber-500">
                {prompt.price === 0 ? (
                  <span className="text-green-500">무료</span>
                ) : (
                  `₩${prompt.price.toLocaleString()}`
                )}
              </div>

              <PromptPreview
                content={prompt.purchased && prompt.content ? prompt.content : prompt.previewContent}
                purchased={prompt.purchased}
              />

              {isSeller ? (
                <button
                  onClick={() => navigate(`/edit/${prompt.id}`)}
                  className="w-full rounded-lg bg-white text-black font-medium hover:bg-neutral-200 px-4 py-2 transition-colors"
                >
                  수정
                </button>
              ) : prompt.purchased ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {downloading ? '다운로드 중...' : '다운로드'}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full rounded-lg bg-white text-black font-medium hover:bg-neutral-200 px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {purchasing ? '처리 중...' : '구매하기'}
                </button>
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

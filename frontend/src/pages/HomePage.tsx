import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listPrompts } from '../api/prompts'
import FilterBar from '../components/FilterBar'
import PromptCard from '../components/PromptCard'
import type { PromptSummary, PromptType, TargetRole } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')

  const [type, setType] = useState<PromptType | undefined>()
  const [targetRole, setTargetRole] = useState<TargetRole | undefined>()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [prompts, setPrompts] = useState<PromptSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value)
      setPage(0)
    }, 300)
  }

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listPrompts({ type, targetRole, keyword: debouncedKeyword || undefined, page, size: 9 })
      setPrompts(result.content)
      setTotalPages(result.totalPages)
    } catch {
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }, [type, targetRole, debouncedKeyword, page])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleTypeChange = (t: PromptType | undefined) => {
    setType(t)
    setPage(0)
  }

  const handleRoleChange = (r: TargetRole | undefined) => {
    setTargetRole(r)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">MarketPlace</h1>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link to="/upload" className="rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 px-4 py-2 text-sm transition-colors">
                  프롬프트 등록
                </Link>
                <Link to="/mypage" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
                  마이페이지
                </Link>
              </>
            ) : (
              <Link to="/login" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
                로그인
              </Link>
            )}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="프롬프트 검색..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>

        <div className="flex gap-6">
          <FilterBar
            type={type}
            targetRole={targetRole}
            onTypeChange={handleTypeChange}
            onRoleChange={handleRoleChange}
          />

          <div className="flex-1">
            {loading ? (
              <p className="text-neutral-500 text-sm">로딩 중...</p>
            ) : prompts.length === 0 ? (
              <p className="text-neutral-500 text-sm">프롬프트가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((p) => (
                  <PromptCard key={p.id} prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center gap-3 mt-6">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-neutral-500 text-sm">{page + 1} / {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/user'
import { listPrompts } from '../api/prompts'
import { getMyPurchases } from '../api/purchases'
import FilterBar from '../components/FilterBar'
import PromptCard from '../components/PromptCard'
import type { PageResponse, PromptSummary, PromptType, TargetRole, UserProfile } from '../types'

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-zinc-900 leading-none min-w-[2.5rem]">
        {value === null ? '—' : value}
      </div>
      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-zinc-100 rounded-xl h-48 border border-zinc-200" />
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')

  const [type, setType] = useState<PromptType | undefined>(undefined)
  const [targetRole, setTargetRole] = useState<TargetRole | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<PromptSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasedCount, setPurchasedCount] = useState<number | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoggedIn) {
      getMyPurchases()
        .then((ids) => setPurchasedCount(ids.length))
        .catch(() => setPurchasedCount(0))
      getMe().then(setUser).catch(() => {})
    } else {
      setPurchasedCount(0)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!showProfile) return
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfile])

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value)
      setPage(0)
    }, 300)
  }

  const handleTypeChange = (t: PromptType | undefined) => {
    setType(t)
    setPage(0)
  }

  const handleRoleChange = (r: TargetRole | undefined) => {
    setTargetRole(r)
    setPage(0)
  }

  const handleResetFilters = () => {
    setType(undefined)
    setTargetRole(undefined)
    setKeyword('')
    setDebouncedKeyword('')
    setPage(0)
  }

  useEffect(() => {
    setLoading(true)
    listPrompts({ type, targetRole, keyword: debouncedKeyword || undefined, page, size: 8 })
      .then((result) => setData(result))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [type, targetRole, debouncedKeyword, page])

  const prompts = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalCount = data?.totalElements ?? null

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-[#4D61E6] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 text-lg">Marketplace</span>
          </button>

          <div className="flex items-center gap-8">
            <StatCard label="Available" value={totalCount} />
            <StatCard label="Purchased" value={purchasedCount} />
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/mypage')}
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  마이페이지
                </button>
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfile((v) => !v)}
                    className="w-8 h-8 rounded-full bg-[#4D61E6] flex items-center justify-center text-white text-xs font-semibold hover:opacity-80 transition-opacity"
                  >
                    {user?.name?.[0]?.toUpperCase() ?? '?'}
                  </button>
                  {showProfile && (
                    <div className="absolute right-0 top-10 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 z-50 min-w-[220px]">
                      <p className="text-sm font-medium text-zinc-900 truncate">{user?.name ?? '사용자'}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{user?.email ?? ''}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Search + 등록 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="프롬프트 제목, 태그, 설명으로 검색..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 shadow-sm transition-colors"
            />
          </div>
          {isLoggedIn && (
            <button
              onClick={() => navigate('/upload')}
              className="shrink-0 px-4 py-2.5 bg-[#4D61E6] text-white text-sm font-medium rounded-xl hover:bg-[#3d50d4] transition-colors"
            >
              + 등록하기
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          type={type}
          targetRole={targetRole}
          onTypeChange={handleTypeChange}
          onRoleChange={handleRoleChange}
        />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-500 text-sm">검색 결과가 없습니다</p>
            <button
              onClick={handleResetFilters}
              className="text-sm text-zinc-900 border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {prompts.map((p) => (
              <PromptCard key={p.id} prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전
            </button>
            <span className="text-sm text-zinc-500 px-2">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              다음 →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

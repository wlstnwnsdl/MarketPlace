import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/user'
import type { UserProfile } from '../types'

export default function Header() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoggedIn) {
      getMe().then(setUser).catch(() => {})
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

  return (
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

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/upload')}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                등록하기
              </button>
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
                  {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
                </button>
                {showProfile && (
                  <div className="absolute right-0 top-10 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 z-50 min-w-[220px]">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user?.name ?? user?.email ?? ''}</p>
                    {user?.name && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{user?.email ?? ''}</p>
                    )}
                    <hr className="border-zinc-100 my-3" />
                    <button
                      onClick={() => {
                        localStorage.removeItem('accessToken')
                        localStorage.removeItem('refreshToken')
                        window.location.href = '/'
                      }}
                      className="text-sm text-red-500 w-full text-left hover:text-red-600 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
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
  )
}

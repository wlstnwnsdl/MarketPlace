import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')

  return (
    <header className="bg-white border-b border-zinc-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
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

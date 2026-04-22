export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="mp-card p-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#4D61E6] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 text-lg">Marketplace</span>
          </div>
          <p className="text-sm text-zinc-500 text-center">
            Claude Code 프롬프트 마켓
          </p>
        </div>

        <button
          onClick={() => { window.location.href = '/oauth2/authorization/google' }}
          className="w-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </button>

        <p className="text-xs text-zinc-400 text-center mt-6">
          개발자를 위한 Claude Code 설정 파일을<br />사고파는 마켓플레이스
        </p>
      </div>
    </div>
  )
}

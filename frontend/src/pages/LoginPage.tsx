export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">MarketPlace</h1>
          <p className="text-neutral-400">Claude Code 프롬프트를 사고파는 곳</p>
        </div>
        <button
          onClick={() => { window.location.href = '/oauth2/authorization/google' }}
          className="rounded-lg bg-white text-black font-medium hover:bg-neutral-200 px-6 py-2.5 transition-colors"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  )
}

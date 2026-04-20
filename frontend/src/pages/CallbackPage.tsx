import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (!accessToken || !refreshToken) {
      navigate('/login', { replace: true })
      return
    }

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    navigate('/', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-zinc-500">인증 중...</p>
    </div>
  )
}

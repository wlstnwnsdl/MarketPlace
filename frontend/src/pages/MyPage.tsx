import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deletePrompt, getPrompt } from '../api/prompts'
import { getMyPrompts, getMyPurchases } from '../api/purchases'
import Header from '../components/Header'
import PromptCard from '../components/PromptCard'
import type { PromptSummary } from '../types'

type Tab = 'purchases' | 'sales'

export default function MyPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('purchases')
  const [purchasedPrompts, setPurchasedPrompts] = useState<PromptSummary[]>([])
  const [myPrompts, setMyPrompts] = useState<PromptSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'purchases') {
      fetchPurchases()
    } else {
      fetchMyPrompts()
    }
  }, [tab])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const ids = await getMyPurchases()
      const results = await Promise.all(ids.map((id) => getPrompt(id)))
      setPurchasedPrompts(results)
    } catch {
      setPurchasedPrompts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMyPrompts = async () => {
    setLoading(true)
    try {
      const data = await getMyPrompts()
      setMyPrompts(data)
    } catch {
      setMyPrompts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 프롬프트를 삭제하시겠습니까?')) return
    try {
      await deletePrompt(id)
      setMyPrompts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  const currentList = tab === 'purchases' ? purchasedPrompts : myPrompts
  const emptyText = tab === 'purchases' ? '아직 구매한 프롬프트가 없습니다.' : '아직 등록한 프롬프트가 없습니다.'

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">마이페이지</h1>

        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setTab('purchases')}
            className={tab === 'purchases' ? 'mp-tab-active' : 'mp-tab-inactive'}
          >
            구매한 프롬프트
          </button>
          <button
            onClick={() => setTab('sales')}
            className={tab === 'sales' ? 'mp-tab-active' : 'mp-tab-inactive'}
          >
            내가 등록한 프롬프트
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-500 text-sm">로딩 중...</p>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm mb-4">{emptyText}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors"
            >
              홈으로 가기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tab === 'purchases'
              ? purchasedPrompts.map((p) => (
                  <PromptCard key={p.id} prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
                ))
              : myPrompts.map((p) => (
                  <div key={p.id} className="flex flex-col">
                    <PromptCard prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
                    <div className="flex gap-2 mt-2 px-1">
                      <button
                        onClick={() => navigate(`/edit/${p.id}`)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  )
}

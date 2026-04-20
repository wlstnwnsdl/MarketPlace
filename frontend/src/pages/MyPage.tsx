import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deletePrompt, getPrompt } from '../api/prompts'
import { getMyPrompts, getMyPurchases } from '../api/purchases'
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
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      await deletePrompt(id)
      setMyPrompts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-white mb-6">마이페이지</h1>

        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setTab('purchases')}
            className={tab === 'purchases'
              ? 'rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium'
              : 'text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors'}
          >
            구매 내역
          </button>
          <button
            onClick={() => setTab('sales')}
            className={tab === 'sales'
              ? 'rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium'
              : 'text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors'}
          >
            판매 목록
          </button>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">로딩 중...</p>
        ) : tab === 'purchases' ? (
          purchasedPrompts.length === 0 ? (
            <p className="text-neutral-500 text-sm">구매한 프롬프트가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedPrompts.map((p) => (
                <PromptCard key={p.id} prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
              ))}
            </div>
          )
        ) : (
          myPrompts.length === 0 ? (
            <p className="text-neutral-500 text-sm">등록한 프롬프트가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPrompts.map((p) => (
                <div key={p.id} className="relative">
                  <PromptCard prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />
                  <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/edit/${p.id}`)}
                      className="rounded bg-neutral-700 text-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-600 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded bg-neutral-700 text-red-400 px-2 py-0.5 text-xs hover:bg-neutral-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

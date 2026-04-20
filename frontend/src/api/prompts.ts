import client from './client'
import type { PageResponse, PromptDetail, PromptSummary, PromptType, TargetRole } from '../types'

export async function listPrompts(params: {
  type?: PromptType
  targetRole?: TargetRole
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<PromptSummary>> {
  const { data } = await client.get<PageResponse<PromptSummary>>('/prompts', { params })
  return data
}

export async function getPrompt(id: number): Promise<PromptDetail> {
  const { data } = await client.get<PromptDetail>(`/prompts/${id}`)
  return data
}

export async function createPrompt(payload: {
  title: string
  description: string
  content: string
  type: PromptType
  targetRole?: TargetRole
  price: number
  tags: string[]
}): Promise<PromptSummary> {
  const { data } = await client.post<PromptSummary>('/prompts', payload)
  return data
}

export async function updatePrompt(
  id: number,
  payload: {
    title: string
    description: string
    content: string
    targetRole?: TargetRole
    price: number
    tags: string[]
  }
): Promise<PromptSummary> {
  const { data } = await client.put<PromptSummary>(`/prompts/${id}`, payload)
  return data
}

export async function deletePrompt(id: number): Promise<void> {
  await client.delete(`/prompts/${id}`)
}

export async function downloadPrompt(id: number): Promise<Blob> {
  const { data } = await client.get<Blob>(`/prompts/${id}/download`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompt-${id}.md`
  a.click()
  URL.revokeObjectURL(url)
  return data
}

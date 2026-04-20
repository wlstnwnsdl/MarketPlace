import client from './client'
import type { PromptSummary, PurchaseResponse } from '../types'

export async function purchasePrompt(promptId: number): Promise<PurchaseResponse> {
  const { data } = await client.post<PurchaseResponse>(`/purchases/${promptId}`)
  return data
}

export async function getMyPurchases(): Promise<number[]> {
  const { data } = await client.get<number[]>('/purchases')
  return data
}

export async function getMyPrompts(): Promise<PromptSummary[]> {
  const { data } = await client.get<PromptSummary[]>('/users/me/prompts')
  return data
}

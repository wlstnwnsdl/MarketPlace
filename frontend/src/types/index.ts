export type PromptType = 'CLAUDE_MD' | 'AGENT' | 'SKILL' | 'SETTINGS' | 'BUNDLE'
export type TargetRole = 'DEVELOPER' | 'PLANNER' | 'DESIGNER'

export interface PromptSummary {
  id: number
  title: string
  description: string
  previewContent: string
  type: PromptType
  targetRole: TargetRole | null
  price: number
  downloadCount: number
  tags: string[]
  sellerId: number
  createdAt: string
}

export interface PromptDetail extends PromptSummary {
  content: string | null
  purchased: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PurchaseResponse {
  purchaseId: number
  promptId: number
  purchasedAt: string
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
}

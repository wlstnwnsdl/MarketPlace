import client from './client'
import type { UserProfile } from '../types'

export async function getMe(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>('/users/me')
  return data
}

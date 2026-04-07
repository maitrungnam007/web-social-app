import api from './apiClient'
import { ApiResponse } from '../types'

export interface HashtagDto {
  id: number
  name: string
  usageCount: number
  createdAt: string
}

export const hashtagsApi = {
  // Get trending hashtags
  getTrending: async (count: number = 10): Promise<ApiResponse<HashtagDto[]>> => {
    const response = await api.get(`/hashtags/trending?count=${count}`)
    return response.data
  },

  // Search hashtags
  search: async (term: string): Promise<ApiResponse<HashtagDto[]>> => {
    const response = await api.get(`/hashtags/search?term=${encodeURIComponent(term)}`)
    return response.data
  },

  // Get hashtag by name
  getByName: async (name: string): Promise<ApiResponse<HashtagDto>> => {
    const response = await api.get(`/hashtags/${encodeURIComponent(name)}`)
    return response.data
  }
}

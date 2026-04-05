import api from './apiClient'
import { ApiResponse, Story, ArchivedStory, StoryHighlight } from '../types'

export const storiesApi = {
  getActiveStories: async (): Promise<ApiResponse<Story[]>> => {
    const response = await api.get('/stories')
    return response.data
  },
  
  createStory: async (data: { content?: string; mediaUrl?: string; mediaType?: string }): Promise<ApiResponse<Story>> => {
    const response = await api.post('/stories', data)
    return response.data
  },
  
  deleteStory: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/stories/${id}`)
    return response.data
  },
  
  markAsViewed: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/stories/${id}/view`)
    return response.data
  },

  getUserStories: async (userId: string): Promise<ApiResponse<Story[]>> => {
    const response = await api.get(`/stories/user/${userId}`)
    return response.data
  },

  // Story Archive
  getArchivedStories: async (): Promise<ApiResponse<ArchivedStory[]>> => {
    const response = await api.get('/stories/archive')
    return response.data
  },

  // Story Highlights
  getUserHighlights: async (userId: string): Promise<ApiResponse<StoryHighlight[]>> => {
    const response = await api.get(`/stories/highlights/${userId}`)
    return response.data
  },

  createHighlight: async (data: { name: string; coverImageUrl?: string; storyIds?: number[] }): Promise<ApiResponse<StoryHighlight>> => {
    const response = await api.post('/stories/highlights', data)
    return response.data
  },

  updateHighlight: async (id: number, data: { name: string; coverImageUrl?: string }): Promise<ApiResponse<StoryHighlight>> => {
    const response = await api.put(`/stories/highlights/${id}`, data)
    return response.data
  },

  deleteHighlight: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/stories/highlights/${id}`)
    return response.data
  },

  addStoryToHighlight: async (highlightId: number, storyId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/stories/highlights/${highlightId}/stories`, { storyId })
    return response.data
  },

  removeStoryFromHighlight: async (highlightId: number, storyId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/stories/highlights/${highlightId}/stories/${storyId}`)
    return response.data
  },
}

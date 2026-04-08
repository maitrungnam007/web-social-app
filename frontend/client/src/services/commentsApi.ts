import api from './apiClient'
import { ApiResponse, Comment, ContentStats, PagedResult } from '../types'

export const commentsApi = {
  getCommentsByPost: async (postId: number): Promise<ApiResponse<Comment[]>> => {
    const response = await api.get(`/comments/post/${postId}`)
    return response.data
  },

  createComment: async (data: { content: string; postId: number; parentCommentId?: number }): Promise<ApiResponse<Comment>> => {
    const response = await api.post('/comments', data)
    return response.data
  },

  deleteComment: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/comments/${id}`)
    return response.data
  },

  likeComment: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/comments/${id}/like`)
    return response.data
  },

  // Lay thong ke noi dung
  getStats: async (): Promise<ApiResponse<ContentStats>> => {
    const response = await api.get('/comments/stats')
    return response.data
  },

  // Lay danh sach tat ca binh luan (admin)
  getAllComments: async (page: number, pageSize: number): Promise<ApiResponse<PagedResult<Comment>>> => {
    const response = await api.get(`/comments/all?page=${page}&pageSize=${pageSize}`)
    return response.data
  },

  // An binh luan (admin)
  hideComment: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/comments/${id}/hide`)
    return response.data
  },

  // Hien binh luan (admin)
  unhideComment: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/comments/${id}/hide`)
    return response.data
  },
}

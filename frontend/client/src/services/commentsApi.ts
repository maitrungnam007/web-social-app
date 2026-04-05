import api from './apiClient'
import { ApiResponse, Comment } from '../types'

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
}

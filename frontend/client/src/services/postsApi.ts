import api from './apiClient'
import { ApiResponse, Post, PagedResult } from '../types'

export const postsApi = {
  getPosts: async (page: number = 1, pageSize: number = 10, signal?: AbortSignal): Promise<ApiResponse<PagedResult<Post>>> => {
    const response = await api.get(`/posts?page=${page}&pageSize=${pageSize}`, { signal })
    return response.data
  },
  
  getPostsByUserId: async (userId: string, page: number = 1, pageSize: number = 10, signal?: AbortSignal): Promise<ApiResponse<PagedResult<Post>>> => {
    const response = await api.get(`/posts?userId=${userId}&page=${page}&pageSize=${pageSize}`, { signal })
    return response.data
  },
  
  getPost: async (id: number, signal?: AbortSignal): Promise<ApiResponse<Post>> => {
    const response = await api.get(`/posts/${id}`, { signal })
    return response.data
  },
  
  createPost: async (data: { content: string; imageUrl?: string }): Promise<ApiResponse<Post>> => {
    const response = await api.post('/posts', data)
    return response.data
  },
  
  updatePost: async (id: number, data: { content: string; imageUrl?: string }): Promise<ApiResponse<Post>> => {
    const response = await api.put(`/posts/${id}`, data)
    return response.data
  },
  
  deletePost: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/posts/${id}`)
    return response.data
  },
  
  likePost: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/posts/${id}/like`)
    return response.data
  },
  
  unlikePost: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/posts/${id}/like`)
    return response.data
  },
}

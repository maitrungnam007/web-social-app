import api from './apiClient'
import { ApiResponse, User, PagedResult } from '../types'

export const usersApi = {
  getUser: async (id: string, signal?: AbortSignal): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`, { signal })
    return response.data
  },
  
  updateProfile: async (data: { firstName?: string; lastName?: string; bio?: string; avatarUrl?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', data)
    return response.data
  },
  
  searchUsers: async (term: string, signal?: AbortSignal): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/users/search?term=${term}`, { signal })
    return response.data
  },
  
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string; fullUrl: string; user: User }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  deleteAvatar: async (): Promise<ApiResponse<User>> => {
    const response = await api.delete('/users/avatar')
    return response.data
  },
  
  uploadCover: async (file: File): Promise<ApiResponse<{ coverUrl: string; fullUrl: string; user: User }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/users/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  deleteCover: async (): Promise<ApiResponse<User>> => {
    const response = await api.delete('/users/cover')
    return response.data
  },
  
  // Admin: Get all users with pagination
  getAllUsers: async (page: number = 1, pageSize: number = 20, search?: string): Promise<ApiResponse<PagedResult<User>>> => {
    let url = `/users?page=${page}&pageSize=${pageSize}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    const response = await api.get(url)
    return response.data
  },
  
  // Admin: Ban user
  banUser: async (userId: string, reason: string, duration: string = 'permanent'): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/users/${userId}/ban`, { reason, duration })
    return response.data
  },
  
  // Admin: Unban user
  unbanUser: async (userId: string): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/users/${userId}/ban`)
    return response.data
  },
}

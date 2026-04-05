import api from './apiClient'
import { ApiResponse, PagedResult, Notification } from '../types'

export const notificationsApi = {
  getNotifications: async (page: number = 1, pageSize: number = 20): Promise<ApiResponse<PagedResult<Notification>>> => {
    const response = await api.get(`/notifications?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
  
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
  
  markAsRead: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/notifications/${id}/read`)
    return response.data
  },
  
  markAllAsRead: async (): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/notifications/read-all')
    return response.data
  },
}

import api from './apiClient'
import { ApiResponse, User } from '../types'

export const authApi = {
  login: async (username: string, password: string, signal?: AbortSignal): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/login', { userName: username, password }, { signal })
    return response.data
  },
  
  register: async (data: { username: string; email: string; password: string; firstName?: string; lastName?: string }, signal?: AbortSignal): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/register', {
      userName: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    }, { signal })
    return response.data
  },
}

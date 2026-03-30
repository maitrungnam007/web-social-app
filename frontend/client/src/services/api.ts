import axios from 'axios'
import { ApiResponse, User, Post, PagedResult, Comment, Story, Notification, Friendship } from '../types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/login', { userName: username, password })
    return response.data
  },
  
  register: async (data: { username: string; email: string; password: string; firstName?: string; lastName?: string }): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/register', {
      userName: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    return response.data
  },
}

// Posts API
export const postsApi = {
  getPosts: async (page: number = 1, pageSize: number = 10): Promise<ApiResponse<PagedResult<Post>>> => {
    const response = await api.get(`/posts?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
  
  getPost: async (id: number): Promise<ApiResponse<Post>> => {
    const response = await api.get(`/posts/${id}`)
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

// Comments API
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

// Friends API
export const friendsApi = {
  getFriends: async (): Promise<ApiResponse<Friendship[]>> => {
    const response = await api.get('/friends')
    return response.data
  },
  
  getPendingRequests: async (): Promise<ApiResponse<Friendship[]>> => {
    const response = await api.get('/friends/requests')
    return response.data
  },
  
  sendFriendRequest: async (addresseeId: string): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/friends/request', { addresseeId })
    return response.data
  },
  
  acceptFriendRequest: async (friendshipId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/friends/accept/${friendshipId}`)
    return response.data
  },
  
  rejectFriendRequest: async (friendshipId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.post(`/friends/reject/${friendshipId}`)
    return response.data
  },
  
  unfriend: async (friendId: string): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/friends/${friendId}`)
    return response.data
  },
}

// Stories API
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
}

// Notifications API
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

export default api

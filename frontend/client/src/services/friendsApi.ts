import api from './apiClient'
import { ApiResponse, Friendship, Friend, MutualFriend, FriendSuggestion } from '../types'

export const friendsApi = {
  getFriends: async (): Promise<ApiResponse<Friend[]>> => {
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
  
  getSentRequests: async (): Promise<ApiResponse<Friendship[]>> => {
    const response = await api.get('/friends/sent-requests')
    return response.data
  },
  
  cancelFriendRequest: async (friendshipId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/friends/cancel/${friendshipId}`)
    return response.data
  },
  
  getMutualFriends: async (otherUserId: string, signal?: AbortSignal): Promise<ApiResponse<MutualFriend[]>> => {
    const response = await api.get(`/friends/mutual/${otherUserId}`, { signal })
    return response.data
  },
  
  getFriendSuggestions: async (count: number = 10, signal?: AbortSignal): Promise<ApiResponse<FriendSuggestion[]>> => {
    const response = await api.get(`/friends/suggestions?count=${count}`, { signal })
    return response.data
  },
}

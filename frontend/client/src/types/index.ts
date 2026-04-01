export interface User {
  id: string
  userName: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  friendsCount?: number
}

export interface Post {
  id: number
  content: string
  imageUrl?: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  updatedAt?: string
  likeCount: number
  commentCount: number
  isLikedByCurrentUser: boolean
  hashtags: string[]
}

export interface Comment {
  id: number
  content: string
  postId: number
  userId: string
  userName: string
  userAvatar?: string
  parentCommentId?: number
  createdAt: string
  likeCount: number
  isLikedByCurrentUser: boolean
  replies: Comment[]
}

export interface Story {
  id: number
  content?: string
  mediaUrl?: string
  mediaType?: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  expiresAt: string
  viewCount: number
  isViewedByCurrentUser: boolean
}

export interface Notification {
  id: number
  type: 'Like' | 'Comment' | 'FriendRequest' | 'FriendAccepted' | 'StoryView' | 'Mention' | 'Share'
  title: string
  message: string
  relatedEntityId?: string
  relatedEntityType?: string
  isRead: boolean
  createdAt: string
  actorName?: string
  actorAvatar?: string
}

export interface Friendship {
  id: number
  requesterId: string
  requesterName: string
  requesterAvatar?: string
  addresseeId: string
  addresseeName: string
  addresseeAvatar?: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Blocked'
  createdAt: string
}

export interface Friend {
  id: string
  userName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Blocked'
  mutualFriendsCount?: number
}

export interface MutualFriend {
  id: string
  userName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}

export interface FriendSuggestion {
  id: string
  userName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  mutualFriendsCount: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

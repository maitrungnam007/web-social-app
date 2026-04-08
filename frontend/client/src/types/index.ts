export interface User {
  id: string
  userName: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  coverImageUrl?: string
  bio?: string
  friendsCount?: number
  role?: 'User' | 'Admin'
  isBanned?: boolean
  banReason?: string
  banExpiresAt?: string
  violationCount?: number
}

export interface Post {
  id: number
  content: string
  imageUrl?: string
  userId: string
  userName: string
  userFirstName?: string
  userLastName?: string
  userAvatar?: string
  createdAt: string
  updatedAt?: string
  likeCount: number
  commentCount: number
  isLikedByCurrentUser: boolean
  isHidden?: boolean
  hashtags: string[]
}

export interface Comment {
  id: number
  content: string
  postId: number
  postIsHidden?: boolean
  userId: string
  userName: string
  userAvatar?: string
  parentCommentId?: number
  createdAt: string
  likeCount: number
  isLikedByCurrentUser: boolean
  isHidden?: boolean
  replies: Comment[]
}

// Thong ke noi dung
export interface ContentStats {
  totalComments: number
  hiddenComments: number
  totalPosts: number
  hiddenPosts: number
}

export interface Story {
  id: number
  content?: string
  mediaUrl?: string
  mediaType?: string
  duration?: number // seconds
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  expiresAt: string
  viewCount: number
  isViewedByCurrentUser: boolean
}

export interface ArchivedStory {
  id: number
  content?: string
  mediaUrl?: string
  mediaType?: string
  createdAt: string
  expiresAt: string
  viewCount: number
}

export interface StoryHighlight {
  id: number
  name: string
  coverImageUrl?: string
  storyCount: number
  stories: Story[]
  createdAt: string
}

export interface Notification {
  id: number
  type: 'Like' | 'Comment' | 'FriendRequest' | 'FriendAccepted' | 'StoryView' | 'Mention' | 'Share' | 'ReportStatusChanged'
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

// User được mention trong bài viết/comment
export interface MentionUser {
  id: string
  userName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  displayName: string
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

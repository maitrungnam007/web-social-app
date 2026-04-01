import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usersApi, postsApi } from '../services/api'
import { User, Post } from '../types'

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isOwnProfile = !userId || userId === currentUser?.id

  // Load user info ngay lập tức
  useEffect(() => {
    const currentRequestId = ++requestIdRef.current
    
    // Cancel previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    loadUserInfo(currentRequestId, abortControllerRef.current.signal)
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [userId])

  // Load posts sau khi có user
  useEffect(() => {
    if (user && abortControllerRef.current) {
      loadPosts(1, abortControllerRef.current.signal)
    }
  }, [user?.id])

  // Infinite scroll
  useEffect(() => {
    if (!hasMorePosts || loadingPosts) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMorePosts, loadingPosts, currentPage])

  const loadUserInfo = useCallback(async (requestId: number, signal: AbortSignal) => {
    try {
      setLoadingUser(true)
      const targetId = userId || currentUser?.id || ''
      
      const userResponse = await usersApi.getUser(targetId, signal)
      
      if (requestId !== requestIdRef.current) return
      if (signal.aborted) return
      
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data)
        setFormData({
          firstName: userResponse.data.firstName || '',
          lastName: userResponse.data.lastName || '',
          bio: userResponse.data.bio || ''
        })
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) return
      if (requestId === requestIdRef.current) {
        toast.error('Không thể tải thông tin người dùng')
      }
    } finally {
      if (requestId === requestIdRef.current && !signal.aborted) {
        setLoadingUser(false)
      }
    }
  }, [userId, currentUser?.id])

  const loadPosts = useCallback(async (page: number, signal: AbortSignal) => {
    if (!user) return
    
    try {
      setLoadingPosts(true)
      const targetId = user.id
      
      const postsResponse = await postsApi.getPostsByUserId(targetId, page, 6, signal)
      
      if (signal.aborted) return
      
      if (postsResponse.success && postsResponse.data) {
        const newPosts = postsResponse.data.items
        if (page === 1) {
          setPosts(newPosts)
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }
        setHasMorePosts(newPosts.length === 6)
        setCurrentPage(page)
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) return
      toast.error('Không thể tải bài đăng')
    } finally {
      if (!signal.aborted) {
        setLoadingPosts(false)
      }
    }
  }, [user])

  const loadMorePosts = useCallback(() => {
    if (!loadingPosts && hasMorePosts && abortControllerRef.current) {
      loadPosts(currentPage + 1, abortControllerRef.current.signal)
    }
  }, [loadingPosts, hasMorePosts, currentPage, loadPosts])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)')
      return
    }

    try {
      toast.loading('Đang tải lên...')
      const response = await usersApi.uploadAvatar(file)
      if (response.success && response.data) {
        const newAvatarUrl = response.data.avatarUrl
        setUser(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null)
        // Cập nhật user trong AuthContext và localStorage
        updateUser({ avatarUrl: newAvatarUrl })
        toast.success('Cập nhật avatar thành công')
      }
    } catch (error) {
      toast.error('Không thể tải lên avatar')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await usersApi.updateProfile(formData)
      if (response.success && response.data) {
        setUser(response.data)
        // Cập nhật user trong AuthContext và localStorage
        updateUser({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          bio: response.data.bio
        })
        setEditing(false)
        toast.success('Cập nhật thông tin thành công')
      }
    } catch (error) {
      toast.error('Không thể cập nhật thông tin')
    }
  }

  if (loadingUser) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Skeleton Cover */}
        <div className="h-48 bg-gray-200 rounded-t-lg animate-pulse"></div>
        
        {/* Skeleton Profile */}
        <div className="bg-white rounded-b-lg shadow p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-20">
            {/* Skeleton Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 animate-pulse"></div>
            
            {/* Skeleton Info */}
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          
          {/* Skeleton Stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mx-auto mt-1"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mx-auto mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Không tìm thấy người dùng</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>

      {/* Profile Header */}
      <div className="bg-white rounded-b-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-20">
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.avatarUrl ? `http://localhost:5259/api/files/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random&size=128`}
              alt={user.userName}
              className="w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-200"
            />
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.userName}
            </h1>
            <p className="text-gray-500">@{user.userName}</p>
          </div>

          {/* Edit Button */}
          {isOwnProfile && (
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {editing ? 'Hủy' : 'Chỉnh sửa'}
            </button>
          )}
        </div>

        {/* Bio */}
        {!editing && user.bio && (
          <p className="mt-4 text-gray-700">{user.bio}</p>
        )}

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Lưu thay đổi
            </button>
          </form>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-gray-500 text-sm">Bài đăng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-500 text-sm">Bạn bè</p>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Bài đăng</h2>
        {posts.length === 0 && !loadingPosts ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Chưa có bài đăng nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow p-4">
                  <p className="text-gray-700 line-clamp-3">{post.content}</p>
                  {post.imageUrl && (
                    <img 
                      src={`http://localhost:5259/api/files/${post.imageUrl}`} 
                      alt="Post" 
                      className="mt-2 rounded-lg w-full h-40 object-cover"
                    />
                  )}
                  <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                    <span>❤️ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More Indicator */}
            <div ref={loadMoreRef} className="py-6 text-center">
              {loadingPosts && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              {!hasMorePosts && posts.length > 0 && (
                <p className="text-gray-400 text-sm">Đã tải hết bài đăng</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

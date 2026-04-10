import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usersApi, postsApi, storiesApi } from '../services'
import { User, Post, Story, StoryHighlight } from '../types'
import StoryViewer from '../components/StoryViewer'
import ProfileCover from '../components/ProfileCover'
import ProfileAvatar from '../components/ProfileAvatar'
import ProfileHighlights from '../components/ProfileHighlights'
import PostItem from '../components/PostItem'
import ReportModal from '../components/ReportModal'
import { API_BASE_URL } from '../services/apiClient'

export default function Profile() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [highlights, setHighlights] = useState<StoryHighlight[]>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAvatarActions, setShowAvatarActions] = useState(false)
  const [showCoverActions, setShowCoverActions] = useState(false)
  const [viewImage, setViewImage] = useState<{ url: string; type: 'avatar' | 'cover' } | null>(null)
  const [viewingStory, setViewingStory] = useState<Story | null>(null)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [viewingHighlight, setViewingHighlight] = useState<StoryHighlight | null>(null)
  const [showHighlightModal, setShowHighlightModal] = useState(false)
  const [newHighlightName, setNewHighlightName] = useState('')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  })
  const [showReportModal, setShowReportModal] = useState(false)
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

  // Load stories của user này
  useEffect(() => {
    if (user) {
      loadUserStories()
      loadHighlights()
    }
  }, [user?.id])

  const handleDeleteStory = async (storyId: number) => {
    try {
      const response = await storiesApi.deleteStory(storyId)
      if (response.success) {
        toast.success('Đã xóa tin')
        setViewingStory(null)
        loadUserStories()
      }
    } catch (error) {
      toast.error('Không thể xóa tin')
    }
  }

  const loadUserStories = async () => {
    if (!user) return
    try {
      const response = await storiesApi.getUserStories(user.id)
      if (response.success && response.data) {
        setStories(response.data)
      }
    } catch (error) {
      console.error('Failed to load user stories')
    }
  }

  const loadHighlights = async () => {
    if (!user) return
    try {
      const response = await storiesApi.getUserHighlights(user.id)
      if (response.success && response.data) {
        setHighlights(response.data)
      }
    } catch (error) {
      console.error('Failed to load highlights')
    }
  }

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
        setFriendsCount(userResponse.data.friendsCount || 0)
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

  const handleDeleteAvatar = async () => {
    // Hiển thị toast xác nhận
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Bạn có chắc muốn xóa avatar?</p>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                const response = await usersApi.deleteAvatar()
                if (response.success) {
                  setUser(prev => prev ? { ...prev, avatarUrl: undefined } : null)
                  updateUser({ avatarUrl: undefined })
                  toast.success('Đã xóa avatar thành công')
                } else {
                  toast.error(response.message || 'Không thể xóa avatar')
                }
              } catch (error: any) {
                const message = error.response?.data?.message || error.message || 'Không thể xóa avatar'
                toast.error(message)
              }
            }}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const handleAvatarUpload = async (file: File) => {
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
      const loadingToast = toast.loading('Đang tải lên...')
      const response = await usersApi.uploadAvatar(file)
      toast.dismiss(loadingToast)
      
      if (response.success) {
        const newAvatarUrl = response.data?.avatarUrl
        setUser(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null)
        updateUser({ avatarUrl: newAvatarUrl })
        toast.success('Cập nhật avatar thành công')
      } else {
        toast.error(response.message || 'Không thể tải lên avatar')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Không thể tải lên avatar'
      toast.error(message)
    }
  }

  const handleCoverUpload = async (file: File) => {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File không được vượt quá 10MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)')
      return
    }

    try {
      const loadingToast = toast.loading('Đang tải lên...')
      const response = await usersApi.uploadCover(file)
      toast.dismiss(loadingToast)
      
      if (response.success) {
        const newCoverUrl = response.data?.coverUrl
        setUser(prev => prev ? { ...prev, coverImageUrl: newCoverUrl } : null)
        updateUser({ coverImageUrl: newCoverUrl })
        toast.success('Cập nhật ảnh bìa thành công')
      } else {
        toast.error(response.message || 'Không thể tải lên ảnh bìa')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Không thể tải lên ảnh bìa'
      toast.error(message)
    }
  }

  const handleDeleteCover = async () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Bạn có chắc muốn xóa ảnh bìa?</p>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                const response = await usersApi.deleteCover()
                if (response.success) {
                  setUser(prev => prev ? { ...prev, coverImageUrl: undefined } : null)
                  updateUser({ coverImageUrl: undefined })
                  toast.success('Đã xóa ảnh bìa thành công')
                } else {
                  toast.error(response.message || 'Không thể xóa ảnh bìa')
                }
              } catch (error: any) {
                const message = error.response?.data?.message || error.message || 'Không thể xóa ảnh bìa'
                toast.error(message)
              }
            }}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    ), { duration: Infinity })
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

  // Xử lý khi bài viết bị xóa
  const handlePostDelete = (postId: string | number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-16 sm:pt-0">
      {/* Cover Image */}
      <ProfileCover
        user={user}
        isOwnProfile={isOwnProfile}
        showCoverActions={showCoverActions}
        onShowCoverActions={setShowCoverActions}
        onCoverUpload={handleCoverUpload}
        onDeleteCover={handleDeleteCover}
        onViewImage={(url, type) => setViewImage({ url, type })}
      />

      {/* Profile Header */}
      <div className="bg-white rounded-b-lg shadow p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-3 sm:gap-4 -mt-16 sm:-mt-20">
          {/* Avatar */}
          <ProfileAvatar
            user={user}
            stories={stories}
            isOwnProfile={isOwnProfile}
            showAvatarActions={showAvatarActions}
            onShowAvatarActions={setShowAvatarActions}
            onAvatarUpload={handleAvatarUpload}
            onDeleteAvatar={handleDeleteAvatar}
            onViewStory={(story) => {
              setViewingStory(story)
              setCurrentStoryIndex(0)
            }}
          />

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.userName}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">@{user.userName}</p>
          </div>

          {/* Edit Button */}
          {isOwnProfile ? (
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
            >
              {editing ? 'Hủy' : 'Chỉnh sửa hồ sơ'}
            </button>
          ) : (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Báo cáo
            </button>
          )}
        </div>

        {/* Bio */}
        {!editing && user.bio && (
          <p className="mt-3 sm:mt-4 text-gray-700 text-sm sm:text-base">{user.bio}</p>
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
        <div className="flex gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold">{posts.length}</p>
            <p className="text-gray-500 text-xs sm:text-sm">Bài đăng</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold">{friendsCount}</p>
            <p className="text-gray-500 text-xs sm:text-sm">Bạn bè</p>
          </div>
        </div>
      </div>

      {/* Stories & Highlights */}
      <ProfileHighlights
        stories={stories}
        highlights={highlights}
        userName={user?.userName}
        userFirstName={user?.firstName}
        userLastName={user?.lastName}
        userAvatar={user?.avatarUrl}
        onViewStory={(story) => {
          setViewingStory(story)
          setCurrentStoryIndex(0)
        }}
        onViewHighlight={(highlight) => {
          setViewingHighlight(highlight)
          if (highlight.stories.length > 0) {
            setViewingStory(highlight.stories[0])
            setCurrentStoryIndex(0)
          }
        }}
      />

      {/* Posts List - Dùng PostItem giống trang feed */}
      <div className="mt-4 sm:mt-6">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Bài đăng</h2>
        {posts.length === 0 && !loadingPosts ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Chưa có bài đăng nào</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map(post => (
                <PostItem 
                  key={post.id} 
                  post={post} 
                  onPostDelete={handlePostDelete}
                />
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

      {/* Image Viewer Modal - Chỉ cho ảnh bìa */}
      {viewImage && viewImage.type === 'cover' && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewImage(null)}
        >
          <button
            onClick={() => setViewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={viewImage.url}
            alt="Cover"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          stories={viewingHighlight?.stories || stories}
          initialIndex={currentStoryIndex}
          onClose={() => {
            setViewingStory(null)
            setViewingHighlight(null)
          }}
          showDeleteButton={isOwnProfile && !viewingHighlight}
          onDeleteStory={handleDeleteStory}
          showAddToHighlight={isOwnProfile && !viewingHighlight}
          onAddToHighlight={() => setShowHighlightModal(true)}
          userName={user?.userName}
          userFirstName={user?.firstName}
          userLastName={user?.lastName}
          userAvatar={user?.avatarUrl}
        />
      )}

      {/* Highlight Modal */}
      {showHighlightModal && viewingStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thêm vào Tin nổi bật</h3>
            
            {/* Tạo highlight mới */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tên highlight mới..."
                value={newHighlightName}
                onChange={(e) => setNewHighlightName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <button
                onClick={async () => {
                  if (!newHighlightName.trim()) {
                    toast.error('Vui lòng nhập tên highlight')
                    return
                  }
                  try {
                    const response = await storiesApi.createHighlight({
                      name: newHighlightName.trim(),
                      storyIds: [viewingStory.id]
                    })
                    if (response.success) {
                      toast.success('Đã tạo highlight mới')
                      setNewHighlightName('')
                      setShowHighlightModal(false)
                      loadHighlights()
                    } else {
                      toast.error(response.message || 'Lỗi khi tạo highlight')
                    }
                  } catch (error) {
                    toast.error('Có lỗi xảy ra')
                  }
                }}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
              >
                Tạo highlight mới
              </button>
            </div>

            {/* Hoặc chọn highlight có sẵn */}
            {highlights.length > 0 && (
              <>
                <div className="border-t pt-4 mb-2">
                  <p className="text-sm text-gray-500 mb-2">Hoặc thêm vào highlight có sẵn:</p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {highlights.map((h) => (
                    <button
                      key={h.id}
                      onClick={async () => {
                        try {
                          const response = await storiesApi.addStoryToHighlight(h.id, viewingStory.id)
                          if (response.success) {
                            toast.success(`Đã thêm vào "${h.name}"`)
                            setShowHighlightModal(false)
                            loadHighlights()
                          } else {
                            toast.error(response.message || 'Lỗi khi thêm vào highlight')
                          }
                        } catch (error) {
                          toast.error('Có lỗi xảy ra')
                        }
                      }}
                      className="w-full flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 p-0.5">
                        <img
                          src={h.coverImageUrl 
                            ? `${API_BASE_URL}/api/files/${h.coverImageUrl}` 
                            : (h.stories[0]?.mediaUrl 
                              ? `${API_BASE_URL}/api/files/${h.stories[0].mediaUrl}` 
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name.substring(0, 2).toUpperCase())}&background=random&size=40`)}
                          alt={h.name}
                          className="w-full h-full rounded-full object-cover border border-white"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-gray-500">{h.storyCount} tin</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => {
                setShowHighlightModal(false)
                setNewHighlightName('')
              }}
              className="w-full mt-4 border py-2 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal báo cáo người dùng */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="user"
        targetId={user?.id || ''}
        targetName={user?.userName}
      />
    </div>
  )
}

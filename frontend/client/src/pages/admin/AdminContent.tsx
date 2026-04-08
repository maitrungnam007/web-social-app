import { useState, useEffect } from 'react'
import { postsApi, commentsApi } from '../../services'
import { Post, Comment } from '../../types'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

type ContentType = 'posts' | 'comments'
type ContentStatus = 'all' | 'visible' | 'hidden'

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<ContentType>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus>('all')
  
  // Stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    hiddenPosts: 0,
    hiddenComments: 0
  })
  
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: '' as 'delete' | 'hide' | 'unhide',
    targetId: 0,
    targetType: '' as ContentType
  })

  useEffect(() => {
    loadData()
    loadStats()
  }, [activeTab, page, statusFilter])

  const loadStats = async () => {
    try {
      const statsRes = await commentsApi.getStats()
      if (statsRes.success && statsRes.data) {
        setStats({
          totalPosts: statsRes.data.totalPosts,
          totalComments: statsRes.data.totalComments,
          hiddenPosts: statsRes.data.hiddenPosts,
          hiddenComments: statsRes.data.hiddenComments
        })
      }
    } catch (error) {
      console.error('Failed to load stats')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'posts') {
        const response = await postsApi.getPosts(page, pageSize)
        if (response.success && response.data) {
          let filteredPosts = response.data.items
          
          // Apply status filter
          if (statusFilter === 'hidden') {
            filteredPosts = filteredPosts.filter(p => p.isHidden)
          } else if (statusFilter === 'visible') {
            filteredPosts = filteredPosts.filter(p => !p.isHidden)
          }
          
          // Apply search
          if (search) {
            filteredPosts = filteredPosts.filter(p => 
              p.content.toLowerCase().includes(search.toLowerCase()) ||
              p.userName.toLowerCase().includes(search.toLowerCase())
            )
          }
          
          setPosts(filteredPosts)
          setTotalCount(response.data.totalCount)
        }
      } else {
        // Load comments
        const response = await commentsApi.getAllComments(page, pageSize)
        if (response.success && response.data) {
          let filteredComments = response.data.items

          // Apply status filter
          if (statusFilter === 'hidden') {
            filteredComments = filteredComments.filter(c => c.isHidden)
          } else if (statusFilter === 'visible') {
            filteredComments = filteredComments.filter(c => !c.isHidden)
          }

          // Apply search
          if (search) {
            filteredComments = filteredComments.filter(c =>
              c.content.toLowerCase().includes(search.toLowerCase()) ||
              c.userName.toLowerCase().includes(search.toLowerCase())
            )
          }

          setComments(filteredComments)
          setTotalCount(response.data.totalCount)
        }
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleHide = (id: number, type: ContentType) => {
    setConfirm({
      isOpen: true,
      title: 'Ẩn nội dung',
      message: 'Bạn có chắc muốn ẩn nội dung này?',
      action: 'hide',
      targetId: id,
      targetType: type
    })
  }

  const handleUnhide = (id: number, type: ContentType) => {
    setConfirm({
      isOpen: true,
      title: 'Hiện nội dung',
      message: 'Bạn có chắc muốn hiện lại nội dung này?',
      action: 'unhide',
      targetId: id,
      targetType: type
    })
  }

  const handleDelete = (id: number, type: ContentType) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa nội dung',
      message: 'Bạn có chắc muốn xóa nội dung này? Hành động này không thể hoàn tác.',
      action: 'delete',
      targetId: id,
      targetType: type
    })
  }

  
  const executeAction = async () => {
    const { action, targetId, targetType } = confirm
    setConfirm(prev => ({ ...prev, isOpen: false }))
    
    try {
      if (targetType === 'posts') {
        if (action === 'delete') {
          await postsApi.adminDeletePost(targetId)
          toast.success('Đã xóa bài viết')
        } else if (action === 'hide') {
          await postsApi.adminHidePost(targetId)
          toast.success('Đã ẩn bài viết')
        } else if (action === 'unhide') {
          await postsApi.adminUnhidePost(targetId)
          toast.success('Đã hiện bài viết')
        }
      } else {
        // Comments
        if (action === 'delete') {
          await commentsApi.deleteComment(targetId)
          toast.success('Đã xóa bình luận')
        } else if (action === 'hide') {
          await commentsApi.hideComment(targetId)
          toast.success('Đã ẩn bình luận')
        } else if (action === 'unhide') {
          await commentsApi.unhideComment(targetId)
          toast.success('Đã hiện bình luận')
        }
      }
      loadData()
      loadStats()
    } catch (error: any) {
      console.error('Action error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra'
      toast.error(errorMessage)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung</h1>
        <p className="text-gray-500 mt-1">Quản lý bài viết, bình luận trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng bài viết</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng bình luận</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0L9.88 9.88m0 0l3.29 3.29m3.29 3.29l3.59 3.59M3 3l18 18" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bài viết đã ẩn</p>
              <p className="text-xl font-bold text-gray-900">{stats.hiddenPosts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bình luận đã ẩn</p>
              <p className="text-xl font-bold text-gray-900">{stats.hiddenComments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo nội dung hoặc tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ContentStatus); setPage(1); }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('posts'); setPage(1); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bài viết ({stats.totalPosts})
            </button>
            <button
              onClick={() => { setActiveTab('comments'); setPage(1); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bình luận ({stats.totalComments})
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : activeTab === 'posts' ? (
          <div className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không có bài viết nào</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className={`p-4 ${post.isHidden ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <img
                      src={post.userAvatar ? `http://localhost:5259/api/files/${post.userAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=random`}
                      alt={post.userName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.userName}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {post.isHidden ? (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Đã ẩn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Đang hiển thị
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-gray-900 ${post.isHidden ? 'line-through text-gray-400' : ''}`}>
                        {post.content}
                      </p>
                      {post.imageUrl && (
                        <img
                          src={`http://localhost:5259/api/files/${post.imageUrl}`}
                          alt="Post"
                          className="mt-2 max-w-xs rounded-lg"
                        />
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>{post.likeCount} lượt thích</span>
                        <span>{post.commentCount} bình luận</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.isHidden ? (
                        <button
                          onClick={() => handleUnhide(post.id, 'posts')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Hiện
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHide(post.id, 'posts')}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Ẩn
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id, 'posts')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không có bình luận nào</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={`p-4 ${comment.isHidden ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.userAvatar ? `http://localhost:5259/api/files/${comment.userAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=random`}
                      alt={comment.userName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.userName}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {comment.postIsHidden && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                            Bài viết đã ẩn
                          </span>
                        )}
                        {comment.isHidden ? (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Comment đã ẩn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Đang hiển thị
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-gray-900 ${comment.isHidden ? 'line-through text-gray-400' : ''}`}>
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Neu post bi an thi khong cho hien comment */}
                      {comment.postIsHidden ? (
                        <span className="px-3 py-1 text-sm text-gray-500 italic">
                          Cần hiển thị bài viết trước
                        </span>
                      ) : comment.isHidden ? (
                        <button
                          onClick={() => handleUnhide(comment.id, 'comments')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Hiện
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHide(comment.id, 'comments')}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Ẩn
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id, 'comments')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiện thị <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> trong{' '}
                  <span className="font-medium">{totalCount}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={
          confirm.action === 'delete' ? 'Xóa' : 
          confirm.action === 'hide' ? 'Ẩn' : 'Hiện'
        }
        confirmVariant={confirm.action === 'delete' ? 'danger' : 'primary'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { postsApi } from '../../services'
import { Post } from '../../types'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

type ContentType = 'posts' | 'comments'

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<ContentType>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const [showDeleted, setShowDeleted] = useState(false)
  
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: '',
    targetId: 0,
    targetType: '' as ContentType
  })

  useEffect(() => {
    loadData()
  }, [activeTab, page, showDeleted])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'posts') {
        const response = await postsApi.getPosts(page, pageSize)
        if (response.success && response.data) {
          setPosts(response.data.items)
          setTotalCount(response.data.totalCount)
        }
      }
    } catch (error) {
      toast.error('Không thê tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: number, type: ContentType) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa nội dung',
      message: 'Bạn có chắc muốnn xóa nội dung này?',
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
          await postsApi.deletePost(targetId)
          toast.success('Ðã xóa bài viết')
        }
      }
      loadData()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung</h1>
        <p className="text-gray-500 mt-1">Quản lý bài viết, bình luận trong hệ thống</p>
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
              Bài viết
            </button>
          </nav>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Hiển thị nội dung đã xóa</span>
          </label>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Ðang tải...</div>
        ) : activeTab === 'posts' ? (
          <div className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không có bài viết nào</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-4">
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
                      </div>
                      <p className="mt-1 text-gray-900">{post.content}</p>
                      {post.imageUrl && (
                        <img
                          src={`http://localhost:5259/api/files/${post.imageUrl}`}
                          alt="Post"
                          className="mt-2 max-w-xs rounded-lg"
                        />
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>{post.likeCount} luợt thích</span>
                        <span>{post.commentCount} bình luận</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(post.id, 'posts')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Xoa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Hi?n th? <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> trong{' '}
                <span className="font-medium">{totalCount}</span> kết quả
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Truớc
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText="Xóa"
        confirmVariant={confirm.action === 'delete' ? 'danger' : 'primary'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

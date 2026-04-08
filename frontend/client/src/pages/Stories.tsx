import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { storiesApi, filesApi } from '../services'
import { Story, StoryHighlight } from '../types'
import toast from 'react-hot-toast'
import StoryViewer from '../components/StoryViewer'
import ConfirmDialog from '../components/ConfirmDialog'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
}

export default function Stories() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingStory, setViewingStory] = useState<Story | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStoryContent, setNewStoryContent] = useState('')
  const [showHighlightModal, setShowHighlightModal] = useState(false)
  const [newHighlightName, setNewHighlightName] = useState('')
  const [highlights, setHighlights] = useState<StoryHighlight[]>([])
  const [creatingStory, setCreatingStory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      setLoading(true)
      const response = await storiesApi.getActiveStories()
      if (response.success && response.data) {
        setStories(response.data)
      }
    } catch (error) {
      toast.error('Không thể tải tin')
    } finally {
      setLoading(false)
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

  const handleViewStory = async (story: Story) => {
    setViewingStory(story)
    
    if (!story.isViewedByCurrentUser) {
      await storiesApi.markAsViewed(story.id)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleCreateStory = async () => {
    if (!newStoryContent && !selectedFile) {
      toast.error('Vui lòng nhập nội dung hoặc chọn hình ảnh')
      return
    }

    if (creatingStory) return // Prevent double-submit

    try {
      setCreatingStory(true)
      let mediaUrl = ''
      let mediaType = ''

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadResponse = await fetch('http://localhost:5259/api/files/upload?folder=stories', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadResponse.json()
        if (uploadData.success) {
          mediaUrl = uploadData.data.filePath
          mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image'
        }
      }

      const response = await storiesApi.createStory({
        content: newStoryContent,
        mediaUrl,
        mediaType
      })

      if (response.success) {
        toast.success('Đăng tin thành công')
        setShowCreateModal(false)
        setNewStoryContent('')
        setSelectedFile(null)
        setPreviewUrl(null)
        loadStories()
      }
    } catch (error) {
      toast.error('Không thể đăng tin')
    } finally {
      setCreatingStory(false)
    }
  }

  const handleDeleteStory = (storyId: number) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa tin',
      message: 'Bạn có chắc muốn xóa tin này?',
      onConfirm: () => {
        setConfirm(prev => ({ ...prev, isOpen: false }))
        doDeleteStory(storyId)
      }
    })
  }

  const doDeleteStory = async (storyId: number) => {
    try {
      const response = await storiesApi.deleteStory(storyId)
      if (response.success) {
        toast.success('Đã xóa tin')
        setViewingStory(null)
        loadStories()
      }
    } catch (error) {
      toast.error('Không thể xóa tin')
    }
  }

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const key = story.userId
    if (!acc[key]) {
      acc[key] = {
        user: {
          id: story.userId,
          name: story.userName,
          avatar: story.userAvatar
        },
        stories: []
      }
    }
    acc[key].stories.push(story)
    return acc
  }, {} as Record<string, { user: { id: string; name: string; avatar?: string }; stories: Story[] }>)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tin</h1>
      </div>

      {/* Story Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Create Story Card */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 w-28 h-48 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition overflow-hidden"
        >
          <div className="h-3/4 bg-gradient-to-b from-blue-100 to-white"></div>
          <div className="h-1/4 flex flex-col items-center justify-center border-t">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mb-1">
              +
            </div>
            <span className="text-xs text-gray-600">Tạo tin</span>
          </div>
        </div>

        {/* User Story Cards */}
        {Object.values(groupedStories).map((group) => {
          const hasUnviewed = group.stories.some(s => !s.isViewedByCurrentUser)
          return (
            <div
              key={group.user.id}
              onClick={() => handleViewStory(group.stories[0])}
              className="flex-shrink-0 w-28 h-48 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition overflow-hidden relative"
            >
              {/* Story Preview */}
              {group.stories[0].mediaUrl ? (
                <img
                  src={`http://localhost:5259/api/files/${group.stories[0].mediaUrl}`}
                  alt="Story"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-purple-400 to-pink-400 flex items-center justify-center p-2">
                  <p className="text-white text-xs text-center line-clamp-4">
                    {group.stories[0].content}
                  </p>
                </div>
              )}

              {/* User Avatar */}
              <div className="absolute top-2 left-2">
                <div className={`w-10 h-10 rounded-full p-0.5 ${hasUnviewed ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : 'bg-gray-300'}`}>
                  <img
                    src={group.user.avatar ? `http://localhost:5259/api/files/${group.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(group.user.name)}&background=random&size=40`}
                    alt={group.user.name}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
              </div>

              {/* User Name */}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium drop-shadow">
                  {group.user.name}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          stories={stories.filter(s => s.userId === viewingStory.userId)}
          initialIndex={stories.filter(s => s.userId === viewingStory.userId).findIndex(s => s.id === viewingStory.id)}
          onClose={() => setViewingStory(null)}
          showDeleteButton={viewingStory.userId === user?.id}
          onDeleteStory={handleDeleteStory}
          showAddToHighlight={viewingStory.userId === user?.id}
          onAddToHighlight={async () => {
            await loadHighlights()
            setShowHighlightModal(true)
          }}
          userName={viewingStory.userName}
          userAvatar={viewingStory.userAvatar}
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
                            ? `http://localhost:5259/api/files/${h.coverImageUrl}` 
                            : (h.stories[0]?.mediaUrl 
                              ? `http://localhost:5259/api/files/${h.stories[0].mediaUrl}` 
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&background=random&size=40`)}
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

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Tạo tin mới</h2>

            {/* Preview */}
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-4" />
            )}

            {/* Content Input */}
            <textarea
              value={newStoryContent}
              onChange={(e) => setNewStoryContent(e.target.value)}
              placeholder="Nội dung tin..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg mb-4 text-gray-500 hover:border-blue-500 hover:text-blue-500"
            >
              {selectedFile ? 'Đổi hình ảnh' : '+ Thêm hình ảnh'}
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setNewStoryContent('')
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateStory}
                disabled={creatingStory}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${creatingStory ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {creatingStory ? 'Đang đăng...' : 'Đăng tin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText="Xóa"
        confirmVariant="danger"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

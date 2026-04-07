import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postsApi } from '../services'
import { Post } from '../types'
import PostItem from '../components/PostItem'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const response = await postsApi.getPost(parseInt(id))
        if (response.success && response.data) {
          setPost(response.data)
        } else {
          setError(response.message || 'Không tìm thấy bài viết')
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải bài viết')
        console.error(err)
      }
      setLoading(false)
    }

    fetchPost()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-500 text-lg mb-4">Không tìm thấy bài viết</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Quay lại</span>
      </button>

      {/* Post detail */}
      <PostItem post={post} />
    </div>
  )
}

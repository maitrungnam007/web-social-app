import { useRef } from 'react'
import { User } from '../types'
import { API_BASE_URL } from '../services/apiClient'

interface ProfileCoverProps {
  user: User
  isOwnProfile: boolean
  showCoverActions: boolean
  onShowCoverActions: (show: boolean) => void
  onCoverUpload: (file: File) => void
  onDeleteCover: () => void
  onViewImage: (url: string, type: 'avatar' | 'cover') => void
}

export default function ProfileCover({
  user,
  isOwnProfile,
  showCoverActions,
  onShowCoverActions,
  onCoverUpload,
  onDeleteCover,
  onViewImage
}: ProfileCoverProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCoverUpload(file)
    }
  }

  return (
    <div className="relative h-48 rounded-t-lg overflow-hidden group">
      {user.coverImageUrl ? (
        <img
          src={user.coverImageUrl.startsWith('http://') || user.coverImageUrl.startsWith('https://')
            ? user.coverImageUrl
            : `${API_BASE_URL}/api/files/${user.coverImageUrl}`}
          alt="Cover"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onViewImage(user.coverImageUrl!.startsWith('http://') || user.coverImageUrl!.startsWith('https://')
            ? user.coverImageUrl!
            : `${API_BASE_URL}/api/files/${user.coverImageUrl}`, 'cover')}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
      )}

      {/* Hover overlay */}
      {isOwnProfile && user.coverImageUrl && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Xem ảnh
          </span>
        </div>
      )}

      {isOwnProfile && (
        <>
          {/* Edit Button */}
          <button
            onClick={() => onShowCoverActions(!showCoverActions)}
            className="absolute bottom-4 right-4 bg-gray-800/80 text-white px-4 py-2 rounded-lg hover:bg-gray-800 shadow-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.coverImageUrl ? 'Chỉnh sửa' : 'Thêm ảnh bìa'}
          </button>

          {/* Edit Menu */}
          {showCoverActions && (
            <div className="absolute bottom-16 right-4 flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  coverInputRef.current?.click()
                  onShowCoverActions(false)
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Thay đổi ảnh
              </button>
              {user.coverImageUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCover()
                    onShowCoverActions(false)
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa ảnh bìa
                </button>
              )}
            </div>
          )}
        </>
      )}

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

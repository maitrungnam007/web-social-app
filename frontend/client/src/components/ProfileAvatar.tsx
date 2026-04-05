import { useRef } from 'react'
import { User, Story } from '../types'

interface ProfileAvatarProps {
  user: User
  stories: Story[]
  isOwnProfile: boolean
  showAvatarActions: boolean
  onShowAvatarActions: (show: boolean) => void
  onAvatarUpload: (file: File) => void
  onDeleteAvatar: () => void
  onViewStory: (story: Story) => void
}

export default function ProfileAvatar({
  user,
  stories,
  isOwnProfile,
  showAvatarActions,
  onShowAvatarActions,
  onAvatarUpload,
  onDeleteAvatar,
  onViewStory
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (stories.length > 0) {
      onViewStory(stories[0])
    } else if (isOwnProfile) {
      onShowAvatarActions(!showAvatarActions)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAvatarUpload(file)
    }
  }

  return (
    <div className="relative group" onClick={handleClick}>
      <div className={`w-34 h-34 rounded-full p-1 ${stories.length > 0 && !isOwnProfile ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : ''}`}>
        <img
          src={user.avatarUrl ? `http://localhost:5259/api/files/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random&size=128`}
          alt={user.userName}
          className={`w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-200 ${stories.length > 0 || isOwnProfile ? 'cursor-pointer' : ''}`}
        />
      </div>

      {isOwnProfile && (
        <div className="absolute inset-0 rounded-full border-4 border-transparent bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium">Chỉnh sửa</span>
        </div>
      )}

      {isOwnProfile && showAvatarActions && (
        <div className="absolute bottom-0 right-0 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
              onShowAvatarActions(false)
            }}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg transition-colors"
            title="Thay đổi avatar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {user.avatarUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteAvatar()
                onShowAvatarActions(false)
              }}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transition-colors"
              title="Xóa avatar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

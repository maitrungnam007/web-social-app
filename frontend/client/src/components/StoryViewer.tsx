import { useState, useEffect } from 'react'
import { Story } from '../types'

interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  onClose: () => void
  showDeleteButton?: boolean
  onDeleteStory?: (storyId: number) => void
  showAddToHighlight?: boolean
  onAddToHighlight?: () => void
  userName?: string
  userAvatar?: string
}

function formatTimeAgo(dateString: string): string {
  // Backend gửi giờ không có timezone, cần thêm 'Z' để JavaScript hiểu là UTC
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'Vừa xong'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`
  } else if (diffDays === 1) {
    return 'Hôm qua'
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`
  } else {
    return date.toLocaleDateString('vi-VN')
  }
}

export default function StoryViewer({
  stories,
  initialIndex = 0,
  onClose,
  showDeleteButton = false,
  onDeleteStory,
  showAddToHighlight = false,
  onAddToHighlight,
  userName,
  userAvatar
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStory = stories[currentIndex]

  useEffect(() => {
    if (!currentStory) {
      setProgress(0)
      return
    }

    if (isPaused) {
      return
    }

    const duration = currentStory.duration || 7
    const interval = 10
    const step = 100 / (duration * 1000 / interval)

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          handleNext()
          return 0
        }
        return prev + step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [currentStory, isPaused])

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setProgress(0)
      setCurrentIndex(currentIndex + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setProgress(0)
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (!currentStory) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* Story Container with Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Navigation Left */}
        <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 -mt-8">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Story Container */}
        <div className="relative w-[320px] sm:w-[420px] h-[85vh] sm:h-[90vh] max-h-[90vh] flex-shrink-0 rounded-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
            {stories.map((s, i) => {
              const isActive = i === currentIndex
              const isCompleted = i < currentIndex
              return (
                <div key={s.id} className="h-0.5 flex-1 bg-white/40 rounded overflow-hidden">
                  <div 
                    className="h-full bg-white transition-none"
                    style={{ 
                      width: isCompleted ? '100%' : isActive ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Story Content */}
          {currentStory.mediaUrl ? (
            <img
              src={`http://localhost:5259/api/files/${currentStory.mediaUrl}`}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-purple-500 to-pink-500 flex items-center justify-center p-8">
              <p className="text-white text-xl text-center">{currentStory.content}</p>
            </div>
          )}

          {/* User Info */}
          <div className="absolute top-5 sm:top-6 left-2 sm:left-3 z-10 flex items-center gap-2">
            <img
              src={userAvatar ? `http://localhost:5259/api/files/${userAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random&size=40`}
              alt={userName || ''}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-white text-xs sm:text-sm font-medium">{userName}</span>
              <span className="text-white/70 text-[10px] sm:text-xs">{formatTimeAgo(currentStory.createdAt)}</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 sm:top-6 right-2 sm:right-3 z-10 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-white"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Pause/Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-5 sm:top-6 right-8 sm:right-12 z-10 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-white"
          >
            {isPaused ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>

          {/* Click Navigation Areas */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-12 bottom-0 w-1/3 z-10"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-12 bottom-0 w-1/3 z-10"
          />

          {/* View Count */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-white text-xs sm:text-sm">
            👁 {currentStory.viewCount} lượt xem
          </div>

          {/* Action Buttons */}
          {(showDeleteButton || showAddToHighlight) && (
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex gap-1 sm:gap-2">
              {showAddToHighlight && onAddToHighlight && (
                <button
                  onClick={onAddToHighlight}
                  className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="hidden sm:inline">Highlight</span>
                </button>
              )}
              {showDeleteButton && onDeleteStory && (
                <button
                  onClick={() => onDeleteStory(currentStory.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm"
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Right */}
        <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 -mt-8">
          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

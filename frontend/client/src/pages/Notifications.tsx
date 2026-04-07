import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { notificationsApi } from '../services'
import { Notification } from '../types'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        hasMore &&
        !loading
      ) {
        loadNotifications(page + 1)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, page])

  const loadNotifications = async (pageNum: number = 1) => {
    if (loading && pageNum > 1) return
    try {
      setLoading(true)
      const response = await notificationsApi.getNotifications(pageNum, 20)
      if (response.success && response.data) {
        if (pageNum === 1) {
          setNotifications(response.data.items)
        } else {
          // Filter để tránh duplicate
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id))
            const uniqueNew = response.data!.items.filter(n => !existingIds.has(n.id))
            return [...prev, ...uniqueNew]
          })
        }
        setHasMore(response.data.hasNextPage)
        setPage(pageNum)
      }
    } catch (error) {
      toast.error('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      if (response.success && response.data !== undefined) {
        setUnreadCount(response.data)
      }
    } catch (error) {
      console.error('Failed to load unread count')
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await notificationsApi.markAsRead(id)
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead()
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success('Đã đánh dấu tất cả là đã đọc')
      }
    } catch (error) {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  // Xử lý click vào thông báo - điều hướng đến trang tương ứng
  const handleNotificationClick = async (notification: Notification) => {
    // Đánh dấu đã đọc
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    
    // Điều hướng đến trang tương ứng
    switch (notification.type) {
      case 'Like':
      case 'Comment':
      case 'Mention':
        if (notification.relatedEntityId) {
          navigate(`/post/${notification.relatedEntityId}`)
        }
        break
      case 'FriendRequest':
        navigate('/friends?tab=requests')
        break
      case 'FriendAccepted':
        // Không di chuyển - chỉ thông báo đã kết bạn thành công
        break
      case 'StoryView':
        // Không di chuyển - chỉ thông báo ai đã xem story
        break
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'Like':
        return '❤️'
      case 'Comment':
        return '💬'
      case 'FriendRequest':
        return '👤'
      case 'FriendAccepted':
        return '✅'
      case 'StoryView':
        return '👁️'
      case 'Mention':
        return '📢'
      default:
        return '🔔'
    }
  }

  const formatTime = (dateString: string) => {
    // Backend gửi giờ không có timezone, cần thêm 'Z' để JavaScript hiểu là UTC
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    const date = new Date(utcString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days === 1) return 'Hôm qua'
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px] pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pt-20 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 sm:py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm text-left sm:text-right"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow divide-y">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 sm:p-4 flex gap-2 sm:gap-3 hover:bg-gray-50 cursor-pointer ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Icon */}
              <div className="text-xl sm:text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{notification.title}</p>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{notification.message}</p>
                    {notification.actorName && (
                      <p className="text-gray-500 text-xs mt-1">
                        Từ: {notification.actorName}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
              </div>

              {/* Unread Indicator */}
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Loading indicator */}
      {loading && notifications.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* End message */}
      {!hasMore && notifications.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Đã hiển thị tất cả thông báo
        </div>
      )}
    </div>
  )
}

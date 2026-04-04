import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { notificationsApi } from '../services/api'
import { Notification } from '../types'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  const loadNotifications = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await notificationsApi.getNotifications(pageNum, 20)
      if (response.success && response.data) {
        if (pageNum === 1) {
          setNotifications(response.data.items)
        } else {
          setNotifications(prev => [...prev, ...response.data!.items])
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

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1)
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
      case 'Share':
        return '🔗'
      default:
        return '🔔'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow divide-y">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id)
                }
              }}
            >
              {/* Icon */}
              <div className="text-2xl">{getNotificationIcon(notification.type)}</div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    {notification.actorName && (
                      <p className="text-gray-500 text-xs mt-1">
                        Từ: {notification.actorName}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
              </div>

              {/* Unread Indicator */}
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
          >
            {loading ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      )}
    </div>
  )
}

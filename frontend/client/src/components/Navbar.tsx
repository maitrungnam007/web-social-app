import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { notificationsApi, usersApi, hashtagsApi } from '../services'
import { Notification, User } from '../types'
import type { HashtagDto } from '../services/hashtagsApi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [hashtagResults, setHashtagResults] = useState<HashtagDto[]>([])
  const [searching, setSearching] = useState(false)
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const notifButtonRef = useRef<HTMLButtonElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Search users with debounce
  const searchUsers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    try {
      setSearching(true)
      const response = await usersApi.searchUsers(term)
      if (response.success && response.data) {
        setSearchResults(response.data.filter(u => u.id !== user?.id))
        setShowSearchDropdown(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [user?.id])

  // Search hashtags
  const searchHashtags = useCallback(async (term: string) => {
    // Neu term rong, lay trending hashtags
    if (!term.trim()) {
      try {
        setSearching(true)
        const response = await hashtagsApi.getTrending(10)
        if (response.success && response.data) {
          setHashtagResults(response.data)
          setShowSearchDropdown(true)
        }
      } catch (error) {
        console.error('Trending hashtags error:', error)
      } finally {
        setSearching(false)
      }
      return
    }

    try {
      setSearching(true)
      const response = await hashtagsApi.search(term)
      if (response.success && response.data) {
        setHashtagResults(response.data)
        setShowSearchDropdown(true)
      }
    } catch (error) {
      console.error('Hashtag search error:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        if (searchTerm.startsWith('#')) {
          // Search hashtags
          searchHashtags(searchTerm.slice(1))
          setSearchResults([])
        } else {
          // Search users
          searchUsers(searchTerm)
          setHashtagResults([])
        }
      } else {
        setSearchResults([])
        setHashtagResults([])
        setShowSearchDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchUsers, searchHashtags])

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navigate to feed with search query
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm('')
      setShowSearchDropdown(false)
      setShowMobileSearch(false)
    }
  }

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`)
    setSearchTerm('')
    setShowSearchDropdown(false)
  }

  const handleHashtagClick = (hashtagName: string) => {
    navigate(`/?hashtag=${encodeURIComponent(hashtagName)}`)
    setSearchTerm('')
    setShowSearchDropdown(false)
  }

  const handleLogout = () => {
    // Dismiss tất cả toast cũ trước khi hiện toast mới
    toast.dismiss()
    
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">Bạn có chắc chắn muốn đăng xuất không?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id)
              logout()
              toast.success('Đăng xuất thành công!')
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Đăng xuất
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </div>
    ), { duration: Infinity, id: 'logout-confirm' })
  }

  // Lấy danh sách thông báo
  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications(1, 5)
      if (response.success && response.data) {
        setNotifications(response.data.items)
      }
    } catch (error) {
      // Silent fail
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      if (response.success && response.data !== undefined) {
        setUnreadCount(response.data)
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      
      // Kiểm tra xem click có trong button không
      if (notifButtonRef.current && notifButtonRef.current.contains(target)) {
        return
      }
      
      // Kiểm tra xem click có trong dropdown không (dropdown được render qua Portal)
      const dropdownElement = document.getElementById('notification-dropdown')
      if (dropdownElement && dropdownElement.contains(target)) {
        return
      }
      
      // Click outside - đóng dropdown
      setShowNotifDropdown(false)
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Xử lý click vào thông báo - điều hướng đến trang tương ứng
  const handleNotificationClick = async (notification: Notification) => {
    // Đánh dấu đã đọc
    if (!notification.isRead) {
      await notificationsApi.markAsRead(notification.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    setShowNotifDropdown(false)
    
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
      case 'Like': return '❤️'
      case 'Comment': return '💬'
      case 'FriendRequest': return '👤'
      case 'FriendAccepted': return '✅'
      case 'StoryView': return '👁️'
      case 'Mention': return '📢'
      case 'Share': return '🔄'
      default: return '🔔'
    }
  }

  const formatTime = (dateString: string) => {
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    const date = new Date(utcString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút`
    if (hours < 24) return `${hours} giờ`
    if (days < 7) return `${days} ngày`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="text-xl md:text-2xl font-bold text-blue-600 cursor-pointer"
          >
            InteractHub
          </a>

          {/* Desktop Search */}
          <div className="hidden md:block relative" ref={searchDropdownRef}>
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => (searchResults.length > 0 || hashtagResults.length > 0) && setShowSearchDropdown(true)}
                  className="pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  onClick={handleSearch}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
            
            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border max-h-80 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center text-gray-500">Đang tìm kiếm...</div>
                ) : hashtagResults.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-500 border-b">Hashtag</div>
                    {hashtagResults.map((h) => (
                      <div
                        key={h.name}
                        onClick={() => handleHashtagClick(h.name)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500 font-medium">#{h.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{h.usageCount} bài viết</span>
                      </div>
                    ))}
                  </>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-500 border-b">Người dùng</div>
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <img
                          src={u.avatarUrl 
                            ? `http://localhost:5259/api/files/${u.avatarUrl}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.userName)}&background=random&size=40`
                          }
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.userName}
                          </p>
                          <p className="text-xs text-gray-500">@{u.userName}</p>
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={handleSearch}
                      className="p-3 text-center text-blue-500 hover:bg-gray-50 cursor-pointer border-t text-sm"
                    >
                      Tìm bài viết với "{searchTerm}"
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">Không tìm thấy kết quả</div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                ref={notifButtonRef}
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Content */}
              {showNotifDropdown && notifButtonRef.current && createPortal(
                <div
                  id="notification-dropdown"
                  className="fixed z-[9999] bg-white rounded-lg shadow-xl border w-80 max-h-96 overflow-hidden"
                  style={{
                    top: notifButtonRef.current.getBoundingClientRect().bottom + 8,
                    right: window.innerWidth - notifButtonRef.current.getBoundingClientRect().right
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <span className="font-semibold">Thông báo</span>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-blue-500 text-sm hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{notification.title}</p>
                              <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                              <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>

            <Link to="/friends" className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            <Link to={`/profile/${user?.id}`} className="flex items-center space-x-2">
              <img
                src={user?.avatarUrl 
                  ? `http://localhost:5259/api/files/${user.avatarUrl}` 
                  : `https://ui-avatars.com/api/?name=${user?.userName}&background=random`}
                alt={user?.userName}
                className="w-8 h-8 rounded-full"
              />
            </Link>

            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 relative" ref={searchDropdownRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  onClick={handleSearch}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
            
            {/* Mobile Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-80 overflow-y-auto z-50">
                {searching ? (
                  <div className="p-4 text-center text-gray-500">Đang tìm kiếm...</div>
                ) : hashtagResults.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-500 border-b">Hashtag</div>
                    {hashtagResults.map((h) => (
                      <div
                        key={h.name}
                        onClick={() => handleHashtagClick(h.name)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500 font-medium">#{h.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{h.usageCount} bài viết</span>
                      </div>
                    ))}
                  </>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-gray-500 border-b">Người dùng</div>
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <img
                          src={u.avatarUrl 
                            ? `http://localhost:5259/api/files/${u.avatarUrl}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.userName)}&background=random&size=40`
                          }
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.userName}
                          </p>
                          <p className="text-xs text-gray-500">@{u.userName}</p>
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={handleSearch}
                      className="p-3 text-center text-blue-500 hover:bg-gray-50 cursor-pointer border-t text-sm"
                    >
                      Tìm bài viết với "{searchTerm}"
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">Không tìm thấy kết quả</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <Link 
              to="/notifications" 
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Thông bâo</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link 
              to="/friends" 
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Bạn bè</span>
            </Link>

            <Link 
              to={`/profile/${user?.id}`} 
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <img
                src={user?.avatarUrl 
                  ? `http://localhost:5259/api/files/${user.avatarUrl}` 
                  : `https://ui-avatars.com/api/?name=${user?.userName}&background=random`}
                alt={user?.userName}
                className="w-8 h-8 rounded-full"
              />
              <span>Hồ sơ của tôi</span>
            </Link>

            <button
              onClick={() => {
                setShowMobileMenu(false)
                handleLogout()
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-left text-red-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

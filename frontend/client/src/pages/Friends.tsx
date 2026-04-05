import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { friendsApi, usersApi } from '../services'
import { Friendship, User, Friend, MutualFriend, FriendSuggestion } from '../types'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  confirmVariant: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
}

export default function Friends() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [sentRequests, setSentRequests] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'search'>('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [mutualFriends, setMutualFriends] = useState<{ [key: string]: MutualFriend[] }>({})
  const [hoveredFriend, setHoveredFriend] = useState<string | null>(null)
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    confirmVariant: 'danger',
    onConfirm: () => {}
  })
  const requestIdRef = useRef(0)

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current
    loadData(currentRequestId)
  }, [])

  const loadData = useCallback(async (requestId: number) => {
    try {
      setLoading(true)
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
        friendsApi.getSentRequests()
      ])
      
      // Chỉ update state nếu đây là request mới nhất
      if (requestId !== requestIdRef.current) return
      
      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data)
      }
      if (requestsRes.success && requestsRes.data) {
        setPendingRequests(requestsRes.data)
      }
      if (sentRes.success && sentRes.data) {
        setSentRequests(sentRes.data)
      }
    } catch (error) {
      // Chỉ hiện lỗi nếu đây là request mới nhất
      if (requestId === requestIdRef.current) {
        toast.error('Không thể tải dữ liệu')
      }
    } finally {
      // Chỉ tắt loading nếu đây là request mới nhất
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearchUsers(searchTerm)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearchUsers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await usersApi.searchUsers(term)
      if (response.success && response.data) {
        setSearchResults(response.data.filter(u => u.id !== currentUser?.id))
      }
    } catch (error) {
      toast.error('Không thể tìm kiếm')
    } finally {
      setSearching(false)
    }
  }, [currentUser?.id])

  const handleSendFriendRequest = useCallback(async (addresseeId: string) => {
    try {
      const response = await friendsApi.sendFriendRequest(addresseeId)
      if (response.success) {
        toast.success('Đã gửi lời mời kết bạn')
      }
    } catch (error) {
      toast.error('Không thể gửi lời mời')
    }
  }, [])

  const handleAcceptRequest = useCallback(async (friendshipId: number) => {
    try {
      const response = await friendsApi.acceptFriendRequest(friendshipId)
      if (response.success) {
        toast.success('Đã chấp nhận lời mời')
        // Chỉ cập nhật state cục bộ thay vì reload toàn bộ
        setPendingRequests(prev => {
          const acceptedRequest = prev.find(r => r.id === friendshipId)
          if (acceptedRequest) {
            setFriends(f => [...f, {
              id: acceptedRequest.requesterId,
              userName: acceptedRequest.requesterName,
              firstName: undefined,
              lastName: undefined,
              avatarUrl: acceptedRequest.requesterAvatar,
              status: 'Accepted' as const
            }])
            return prev.filter(r => r.id !== friendshipId)
          }
          return prev
        })
      }
    } catch (error) {
      toast.error('Không thể chấp nhận')
    }
  }, [])

  const handleRejectRequest = useCallback((friendshipId: number, requesterName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Từ chối lời mời',
      message: `Bạn có chắc muốn từ chối lời mời kết bạn từ ${requesterName}?`,
      confirmText: 'Từ chối',
      confirmVariant: 'warning',
      onConfirm: () => {
        setConfirm(prev => ({ ...prev, isOpen: false }))
        doRejectRequest(friendshipId)
      }
    })
  }, [])

  const doRejectRequest = useCallback(async (friendshipId: number) => {
    try {
      const response = await friendsApi.rejectFriendRequest(friendshipId)
      if (response.success) {
        toast.success('Đã từ chối lời mời')
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId))
      }
    } catch (error) {
      toast.error('Không thể từ chối')
    }
  }, [])

  const handleUnfriend = useCallback((friendId: string, friendName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Hủy kết bạn',
      message: `Bạn có chắc muốn hủy kết bạn với ${friendName}?`,
      confirmText: 'Hủy kết bạn',
      confirmVariant: 'danger',
      onConfirm: () => {
        setConfirm(prev => ({ ...prev, isOpen: false }))
        doUnfriend(friendId)
      }
    })
  }, [])

  const doUnfriend = useCallback(async (friendId: string) => {
    try {
      const response = await friendsApi.unfriend(friendId)
      if (response.success) {
        toast.success('Đã hủy kết bạn')
        setFriends(prev => prev.filter(f => f.id !== friendId))
      }
    } catch (error) {
      toast.error('Không thể hủy kết bạn')
    }
  }, [])

  const handleCancelRequest = useCallback((friendshipId: number, addresseeName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Thu hồi lời mời',
      message: `Bạn có chắc muốn thu hồi lời mời kết bạn đã gửi cho ${addresseeName}?`,
      confirmText: 'Thu hồi',
      confirmVariant: 'warning',
      onConfirm: () => {
        setConfirm(prev => ({ ...prev, isOpen: false }))
        doCancelRequest(friendshipId)
      }
    })
  }, [])

  const doCancelRequest = useCallback(async (friendshipId: number) => {
    try {
      const response = await friendsApi.cancelFriendRequest(friendshipId)
      if (response.success) {
        toast.success('Đã thu hồi lời mời')
        setSentRequests(prev => prev.filter(r => r.id !== friendshipId))
      }
    } catch (error) {
      toast.error('Không thể thu hồi lời mời')
    }
  }, [])

  // Fetch friend suggestions
  const fetchFriendSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true)
      const response = await friendsApi.getFriendSuggestions(10)
      if (response.success && response.data) {
        setFriendSuggestions(response.data)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Load suggestions khi vào tab search
  useEffect(() => {
    if (activeTab === 'search' && friendSuggestions.length === 0) {
      fetchFriendSuggestions()
    }
  }, [activeTab, friendSuggestions.length, fetchFriendSuggestions])

  // Fetch mutual friends khi hover vào friend
  const fetchMutualFriends = useCallback(async (friendId: string) => {
    if (mutualFriends[friendId]) return // Đã có cache
    
    try {
      const response = await friendsApi.getMutualFriends(friendId)
      if (response.success && response.data) {
        setMutualFriends(prev => ({ ...prev, [friendId]: response.data! }))
      }
    } catch (error) {
      // Silent fail - không hiện lỗi
    }
  }, [mutualFriends])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bạn bè</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'friends' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Bạn bè ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg relative ${
            activeTab === 'requests' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Lời mời
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-lg relative ${
            activeTab === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Đã gửi
          {sentRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {sentRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'search' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Tìm bạn
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="bg-white rounded-lg shadow divide-y">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Bạn chưa có bạn bè nào
            </div>
          ) : (
            friends.map((friend) => {
              const displayName = friend.firstName && friend.lastName
                ? `${friend.firstName} ${friend.lastName}`
                : friend.userName

              return (
                <div 
                  key={friend.id} 
                  className="p-4 flex items-center gap-4"
                  onMouseEnter={() => {
                    setHoveredFriend(friend.id)
                    fetchMutualFriends(friend.id)
                  }}
                  onMouseLeave={() => setHoveredFriend(null)}
                >
                  <img
                    src={friend.avatarUrl ? `http://localhost:5259/api/files/${friend.avatarUrl}` : `https://ui-avatars.com/api/?name=${friend.userName}&background=random`}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 relative">
                    <p className="font-medium">{displayName}</p>
                    <p className="text-gray-500 text-sm">@{friend.userName}</p>
                    
                    {/* Mutual friends indicator */}
                    {mutualFriends[friend.id] && mutualFriends[friend.id].length > 0 && (
                      <p className="text-gray-400 text-xs mt-1">
                        {mutualFriends[friend.id].length} bạn chung
                      </p>
                    )}
                    
                    {/* Tooltip hiển thị tên bạn chung khi hover */}
                    {hoveredFriend === friend.id && mutualFriends[friend.id] && mutualFriends[friend.id].length > 0 && (
                      <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg min-w-[150px]">
                        <p className="font-semibold mb-1">Bạn chung:</p>
                        {mutualFriends[friend.id].slice(0, 3).map((mf) => (
                          <p key={mf.id} className="truncate">
                            {mf.firstName && mf.lastName 
                              ? `${mf.firstName} ${mf.lastName}` 
                              : mf.userName}
                          </p>
                        ))}
                        {mutualFriends[friend.id].length > 3 && (
                          <p className="text-gray-300">+{mutualFriends[friend.id].length - 3} nữa</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/profile/${friend.id}`}
                      className="px-3 py-1 text-blue-500 hover:bg-blue-50 rounded-lg text-sm"
                    >
                      Xem trang
                    </button>
                    <button
                      onClick={() => handleUnfriend(friend.id, displayName)}
                      className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg text-sm"
                    >
                      Hủy kết bạn
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow divide-y">
          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Không có lời mời kết bạn nào
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-4 flex items-center gap-4"
                onMouseEnter={() => {
                  setHoveredFriend(request.requesterId)
                  fetchMutualFriends(request.requesterId)
                }}
                onMouseLeave={() => setHoveredFriend(null)}
              >
                <img
                  src={request.requesterAvatar ? `http://localhost:5259/api/files/${request.requesterAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(request.requesterName)}&background=random&size=48`}
                  alt={request.requesterName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 relative">
                  <p className="font-medium">{request.requesterName}</p>
                  <p className="text-gray-500 text-sm">Muốn kết bạn</p>
                  
                  {/* Mutual friends indicator */}
                  {mutualFriends[request.requesterId] && mutualFriends[request.requesterId].length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      {mutualFriends[request.requesterId].length} bạn chung
                    </p>
                  )}
                  
                  {/* Tooltip */}
                  {hoveredFriend === request.requesterId && mutualFriends[request.requesterId] && mutualFriends[request.requesterId].length > 0 && (
                    <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg min-w-[150px]">
                      <p className="font-semibold mb-1">Bạn chung:</p>
                      {mutualFriends[request.requesterId].slice(0, 3).map((mf) => (
                        <p key={mf.id} className="truncate">
                          {mf.firstName && mf.lastName 
                            ? `${mf.firstName} ${mf.lastName}` 
                            : mf.userName}
                        </p>
                      ))}
                      {mutualFriends[request.requesterId].length > 3 && (
                        <p className="text-gray-300">+{mutualFriends[request.requesterId].length - 3} nữa</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id, request.requesterName)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-lg shadow divide-y">
          {sentRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Bạn chưa gửi lời mời kết bạn nào
            </div>
          ) : (
            sentRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-4 flex items-center gap-4"
                onMouseEnter={() => {
                  setHoveredFriend(request.addresseeId)
                  fetchMutualFriends(request.addresseeId)
                }}
                onMouseLeave={() => setHoveredFriend(null)}
              >
                <img
                  src={request.addresseeAvatar ? `http://localhost:5259/api/files/${request.addresseeAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(request.addresseeName)}&background=random&size=48`}
                  alt={request.addresseeName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 relative">
                  <p className="font-medium">{request.addresseeName}</p>
                  <p className="text-gray-500 text-sm">Đang chờ phản hồi</p>
                  
                  {/* Mutual friends indicator */}
                  {mutualFriends[request.addresseeId] && mutualFriends[request.addresseeId].length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      {mutualFriends[request.addresseeId].length} bạn chung
                    </p>
                  )}
                  
                  {/* Tooltip */}
                  {hoveredFriend === request.addresseeId && mutualFriends[request.addresseeId] && mutualFriends[request.addresseeId].length > 0 && (
                    <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg min-w-[150px]">
                      <p className="font-semibold mb-1">Bạn chung:</p>
                      {mutualFriends[request.addresseeId].slice(0, 3).map((mf) => (
                        <p key={mf.id} className="truncate">
                          {mf.firstName && mf.lastName 
                            ? `${mf.firstName} ${mf.lastName}` 
                            : mf.userName}
                        </p>
                      ))}
                      {mutualFriends[request.addresseeId].length > 3 && (
                        <p className="text-gray-300">+{mutualFriends[request.addresseeId].length - 3} nữa</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelRequest(request.id, request.addresseeName)}
                    className="px-4 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 text-sm"
                  >
                    Thu hồi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Friend Suggestions */}
          {!searchTerm && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Gợi ý kết bạn</h3>
              <div className="bg-white rounded-lg shadow divide-y">
                {loadingSuggestions ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : friendSuggestions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Không có gợi ý nào
                  </div>
                ) : (
                  friendSuggestions.map((suggestion) => {
                    const isFriend = friends.some(f => f.id === suggestion.id)
                    const hasPendingRequest = pendingRequests.some(
                      r => r.requesterId === suggestion.id || r.addresseeId === suggestion.id
                    )

                    return (
                      <div 
                        key={suggestion.id} 
                        className="p-4 flex items-center gap-4"
                        onMouseEnter={() => {
                          setHoveredFriend(suggestion.id)
                          fetchMutualFriends(suggestion.id)
                        }}
                        onMouseLeave={() => setHoveredFriend(null)}
                      >
                        <img
                          src={suggestion.avatarUrl ? `http://localhost:5259/api/files/${suggestion.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.userName)}&background=random&size=48`}
                          alt={suggestion.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 relative">
                          <p className="font-medium">
                            {suggestion.firstName && suggestion.lastName
                              ? `${suggestion.firstName} ${suggestion.lastName}`
                              : suggestion.userName}
                          </p>
                          <p className="text-gray-500 text-sm">@{suggestion.userName}</p>
                          
                          {/* Mutual friends count */}
                          {suggestion.mutualFriendsCount > 0 && (
                            <p className="text-gray-400 text-xs mt-1">
                              {suggestion.mutualFriendsCount} bạn chung
                            </p>
                          )}
                          
                          {/* Tooltip */}
                          {hoveredFriend === suggestion.id && mutualFriends[suggestion.id] && mutualFriends[suggestion.id].length > 0 && (
                            <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg min-w-[150px]">
                              <p className="font-semibold mb-1">Bạn chung:</p>
                              {mutualFriends[suggestion.id].slice(0, 3).map((mf) => (
                                <p key={mf.id} className="truncate">
                                  {mf.firstName && mf.lastName 
                                    ? `${mf.firstName} ${mf.lastName}` 
                                    : mf.userName}
                                </p>
                              ))}
                              {mutualFriends[suggestion.id].length > 3 && (
                                <p className="text-gray-300">+{mutualFriends[suggestion.id].length - 3} nữa</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/profile/${suggestion.id}`)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            Xem trang
                          </button>
                          {isFriend ? (
                            <span className="px-4 py-2 text-green-500 text-sm">Đã là bạn</span>
                          ) : hasPendingRequest ? (
                            <span className="px-4 py-2 text-gray-500 text-sm">Đã gửi lời mời</span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(suggestion.id)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                            >
                              Kết bạn
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="bg-white rounded-lg shadow divide-y">
            {searching ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy người dùng nào' : 'Nhập tên để tìm kiếm'}
              </div>
            ) : (
              searchResults.map((user) => {
                const isFriend = friends.some(f => f.id === user.id)
                const hasPendingRequest = pendingRequests.some(
                  r => r.requesterId === user.id || r.addresseeId === user.id
                )

                return (
                  <div 
                    key={user.id} 
                    className="p-4 flex items-center gap-4"
                    onMouseEnter={() => {
                      setHoveredFriend(user.id)
                      fetchMutualFriends(user.id)
                    }}
                    onMouseLeave={() => setHoveredFriend(null)}
                  >
                    <img
                      src={user.avatarUrl ? `http://localhost:5259/api/files/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random&size=48`}
                      alt={user.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 relative">
                      <p className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.userName}
                      </p>
                      <p className="text-gray-500 text-sm">@{user.userName}</p>
                      
                      {/* Mutual friends indicator */}
                      {mutualFriends[user.id] && mutualFriends[user.id].length > 0 && (
                        <p className="text-gray-400 text-xs mt-1">
                          {mutualFriends[user.id].length} bạn chung
                        </p>
                      )}
                      
                      {/* Tooltip */}
                      {hoveredFriend === user.id && mutualFriends[user.id] && mutualFriends[user.id].length > 0 && (
                        <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg min-w-[150px]">
                          <p className="font-semibold mb-1">Bạn chung:</p>
                          {mutualFriends[user.id].slice(0, 3).map((mf) => (
                            <p key={mf.id} className="truncate">
                              {mf.firstName && mf.lastName 
                                ? `${mf.firstName} ${mf.lastName}` 
                                : mf.userName}
                            </p>
                          ))}
                          {mutualFriends[user.id].length > 3 && (
                            <p className="text-gray-300">+{mutualFriends[user.id].length - 3} nữa</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Xem trang
                      </button>
                      {isFriend ? (
                        <span className="px-4 py-2 text-green-500 text-sm">Đã là bạn</span>
                      ) : hasPendingRequest ? (
                        <span className="px-4 py-2 text-gray-500 text-sm">Đã gửi lời mời</span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        confirmVariant={confirm.confirmVariant}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { friendsApi, hashtagsApi } from '../services'
import { MentionUser } from '../types'
import type { HashtagDto } from '../services/hashtagsApi'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: MentionUser[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showHashtags?: boolean // Enable hashtag autocomplete
}

// Component input hỗ trợ mention @username với autocomplete
export default function MentionInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  showHashtags = true
}: MentionInputProps) {
  // Mention (@) states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  const [friends, setFriends] = useState<MentionUser[]>([])
  const [mentions, setMentions] = useState<MentionUser[]>([])
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  
  // Hashtag (#) states
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false)
  const [hashtagQuery, setHashtagQuery] = useState('')
  const [hashtagStartPos, setHashtagStartPos] = useState(-1)
  const [hashtags, setHashtags] = useState<HashtagDto[]>([])
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Tìm kiếm bạn bè khi mention query thay đổi
  useEffect(() => {
    if (mentionQuery === '' && showMentionDropdown) {
      // Load tất cả bạn bè khi mới gõ @
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      
      friendsApi.searchFriendsForMention('', abortControllerRef.current.signal)
        .then(res => {
          if (res.success && res.data) {
            setFriends(res.data)
            setSelectedMentionIndex(0)
          }
        })
        .catch(() => {})
    } else if (mentionQuery && showMentionDropdown) {
      // Debounce search
      const timer = setTimeout(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()
        
        friendsApi.searchFriendsForMention(mentionQuery, abortControllerRef.current.signal)
          .then(res => {
            if (res.success && res.data) {
              setFriends(res.data)
              setSelectedMentionIndex(0)
            }
          })
          .catch(() => {})
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [mentionQuery, showMentionDropdown])

  // Tìm kiếm hashtag khi hashtag query thay đổi
  useEffect(() => {
    if (!showHashtags) return
    
    if (hashtagQuery === '' && showHashtagDropdown) {
      // Load trending hashtags khi mới gõ #
      hashtagsApi.getTrending(10)
        .then(res => {
          if (res.success && res.data) {
            setHashtags(res.data)
            setSelectedHashtagIndex(0)
          }
        })
        .catch(() => {})
    } else if (hashtagQuery && showHashtagDropdown) {
      const timer = setTimeout(() => {
        hashtagsApi.search(hashtagQuery)
          .then(res => {
            if (res.success && res.data) {
              setHashtags(res.data)
              setSelectedHashtagIndex(0)
            }
          })
          .catch(() => {})
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [hashtagQuery, showHashtagDropdown, showHashtags])

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false)
        setShowHashtagDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Xử lý input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart ?? 0
    
    // Reset dropdowns
    let foundMention = false
    let foundHashtag = false
    
    // Tìm @ gần nhất trước cursor (mention)
    let atPos = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (newValue[i] === '@') {
        if (i === 0 || newValue[i - 1] === ' ' || newValue[i - 1] === '\n') {
          atPos = i
          break
        }
      } else if (newValue[i] === ' ' || newValue[i] === '\n') {
        break
      }
    }
    
    // Tìm # gần nhất trước cursor (hashtag)
    let hashPos = -1
    if (showHashtags) {
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (newValue[i] === '#') {
          if (i === 0 || newValue[i - 1] === ' ' || newValue[i - 1] === '\n') {
            hashPos = i
            break
          }
        } else if (newValue[i] === ' ' || newValue[i] === '\n') {
          break
        }
      }
    }
    
    // Xác định dropdown nào mở (ưu tiên cái gần cursor hơn)
    if (atPos !== -1 && (hashPos === -1 || atPos > hashPos)) {
      const query = newValue.substring(atPos + 1, cursorPos)
      setMentionQuery(query)
      setMentionStartPos(atPos)
      setShowMentionDropdown(true)
      setShowHashtagDropdown(false)
      foundMention = true
    } else if (hashPos !== -1) {
      const query = newValue.substring(hashPos + 1, cursorPos)
      setHashtagQuery(query)
      setHashtagStartPos(hashPos)
      setShowHashtagDropdown(true)
      setShowMentionDropdown(false)
      foundHashtag = true
    }
    
    if (!foundMention) {
      setShowMentionDropdown(false)
      setMentionQuery('')
      setMentionStartPos(-1)
    }
    
    if (!foundHashtag) {
      setShowHashtagDropdown(false)
      setHashtagQuery('')
      setHashtagStartPos(-1)
    }
    
    // Cập nhật mentions list
    const currentMentions = extractMentions(newValue)
    setMentions(currentMentions)
    
    onChange(newValue, currentMentions)
  }

  // Trích xuất mentions từ content
  const extractMentions = useCallback((content: string): MentionUser[] => {
    const mentionPattern = /@(\w+)/g
    const matches = [...content.matchAll(mentionPattern)]
    const foundMentions: MentionUser[] = []
    
    for (const match of matches) {
      const username = match[1]
      // Tìm trong friends list đã load
      const user = friends.find(f => f.userName.toLowerCase() === username.toLowerCase())
      if (user && !foundMentions.find(m => m.id === user.id)) {
        foundMentions.push(user)
      }
    }
    
    return foundMentions
  }, [friends])

  // Chọn user từ mention dropdown
  const selectUser = (user: MentionUser) => {
    if (!inputRef.current || mentionStartPos === -1) return
    
    const cursorPos = inputRef.current.selectionStart ?? 0
    const beforeMention = value.substring(0, mentionStartPos)
    const afterCursor = value.substring(cursorPos)
    
    const newValue = beforeMention + `@${user.userName} ` + afterCursor
    
    const newMentions = [...mentions]
    if (!newMentions.find(m => m.id === user.id)) {
      newMentions.push(user)
    }
    setMentions(newMentions)
    
    onChange(newValue, newMentions)
    setShowMentionDropdown(false)
    setMentionQuery('')
    setMentionStartPos(-1)
    
    setTimeout(() => {
      const newCursorPos = beforeMention.length + user.userName.length + 2
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Chọn hashtag từ dropdown
  const selectHashtag = (hashtag: HashtagDto) => {
    if (!inputRef.current || hashtagStartPos === -1) return
    
    const cursorPos = inputRef.current.selectionStart ?? 0
    const beforeHashtag = value.substring(0, hashtagStartPos)
    const afterCursor = value.substring(cursorPos)
    
    const newValue = beforeHashtag + `#${hashtag.name} ` + afterCursor
    
    onChange(newValue, mentions)
    setShowHashtagDropdown(false)
    setHashtagQuery('')
    setHashtagStartPos(-1)
    
    setTimeout(() => {
      const newCursorPos = beforeHashtag.length + hashtag.name.length + 2
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Xử lý key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Mention dropdown navigation
    if (showMentionDropdown && friends.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex(prev => (prev + 1) % friends.length)
        return
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex(prev => (prev - 1 + friends.length) % friends.length)
        return
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectUser(friends[selectedMentionIndex])
        return
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false)
        return
      }
    }
    
    // Hashtag dropdown navigation
    if (showHashtagDropdown && hashtags.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedHashtagIndex(prev => (prev + 1) % hashtags.length)
        return
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedHashtagIndex(prev => (prev - 1 + hashtags.length) % hashtags.length)
        return
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectHashtag(hashtags[selectedHashtagIndex])
        return
      } else if (e.key === 'Escape') {
        setShowHashtagDropdown(false)
        return
      }
    }
  }

  return (
    <div className="relative w-full flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${className}`}
      />
      
      {/* Mention Dropdown - dùng Portal */}
      {showMentionDropdown && inputRef.current && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[200px]"
          style={{
            top: inputRef.current.getBoundingClientRect().bottom + 4,
            left: inputRef.current.getBoundingClientRect().left,
            width: Math.max(inputRef.current.offsetWidth, 200)
          }}
        >
          {friends.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">
              Không tìm thấy bạn bè
            </div>
          ) : (
            friends.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 p-2 cursor-pointer ${
                  index === selectedMentionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => selectUser(user)}
                onMouseEnter={() => setSelectedMentionIndex(index)}
              >
                <img
                  src={user.avatarUrl || '/default-avatar.png'}
                  alt={user.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.displayName}</p>
                  <p className="text-gray-500 text-xs">@{user.userName}</p>
                </div>
              </div>
            ))
          )}
        </div>,
        document.body
      )}
      
      {/* Hashtag Dropdown - dùng Portal */}
      {showHashtagDropdown && inputRef.current && createPortal(
        <div
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[200px]"
          style={{
            top: inputRef.current.getBoundingClientRect().bottom + 4,
            left: inputRef.current.getBoundingClientRect().left,
            width: Math.max(inputRef.current.offsetWidth, 200)
          }}
        >
          {hashtags.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">
              Không tìm thấy hashtag
            </div>
          ) : (
            <>
              <div className="p-2 text-xs text-gray-500 border-b">
                {hashtagQuery === '' ? 'Trending (7 ngày qua)' : 'Hashtag'}
              </div>
              {hashtags.map((hashtag, index) => (
                <div
                  key={hashtag.id}
                  className={`flex items-center justify-between p-2 cursor-pointer ${
                    index === selectedHashtagIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectHashtag(hashtag)}
                  onMouseEnter={() => setSelectedHashtagIndex(index)}
                >
                  <span className="text-blue-500 font-medium">#{hashtag.name}</span>
                  <span className="text-xs text-gray-500">{hashtag.usageCount} bài viết</span>
                </div>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

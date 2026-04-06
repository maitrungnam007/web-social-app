import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { friendsApi } from '../services'
import { MentionUser } from '../types'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: MentionUser[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Component input hỗ trợ mention @username với autocomplete
export default function MentionInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  const [friends, setFriends] = useState<MentionUser[]>([])
  const [mentions, setMentions] = useState<MentionUser[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Tìm kiếm bạn bè khi query thay đổi
  useEffect(() => {
    if (mentionQuery === '' && showDropdown) {
      // Load tất cả bạn bè khi mới gõ @
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      
      console.log('[MentionInput] Loading friends for mention...')
      friendsApi.searchFriendsForMention('', abortControllerRef.current.signal)
        .then(res => {
          console.log('[MentionInput] API response:', res)
          if (res.success && res.data) {
            console.log('[MentionInput] Friends found:', res.data.length, res.data)
            setFriends(res.data)
            setSelectedIndex(0)
          } else {
            console.log('[MentionInput] API failed or no data:', res)
          }
        })
        .catch((err) => {
          console.error('[MentionInput] API error:', err)
        })
    } else if (mentionQuery && showDropdown) {
      // Debounce search
      const timer = setTimeout(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()
        
        friendsApi.searchFriendsForMention(mentionQuery, abortControllerRef.current.signal)
          .then(res => {
            if (res.success && res.data) {
              setFriends(res.data)
              setSelectedIndex(0)
            }
          })
          .catch(() => {})
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [mentionQuery, showDropdown])

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Xử lý input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart ?? 0
    
    // Tìm @ gần nhất trước cursor
    let atPos = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (newValue[i] === '@') {
        // Kiểm tra xem @ này có phải là bắt đầu mention không (không có chữ cái trước nó hoặc có space)
        if (i === 0 || newValue[i - 1] === ' ' || newValue[i - 1] === '\n') {
          atPos = i
          break
        }
      } else if (newValue[i] === ' ' || newValue[i] === '\n') {
        // Gặp space/newline trước khi gặp @ -> không có mention đang mở
        break
      }
    }
    
    if (atPos !== -1 && atPos < cursorPos) {
      // Có @ đang mở
      const query = newValue.substring(atPos + 1, cursorPos)
      console.log('[MentionInput] Show dropdown, query:', query, 'atPos:', atPos)
      setMentionQuery(query)
      setMentionStartPos(atPos)
      setShowDropdown(true)
    } else {
      console.log('[MentionInput] Hide dropdown, atPos:', atPos)
      setShowDropdown(false)
      setMentionQuery('')
      setMentionStartPos(-1)
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

  // Chọn user từ dropdown
  const selectUser = (user: MentionUser) => {
    if (!inputRef.current || mentionStartPos === -1) return
    
    const cursorPos = inputRef.current.selectionStart ?? 0
    const beforeMention = value.substring(0, mentionStartPos)
    const afterCursor = value.substring(cursorPos)
    
    // Thay thế @query bằng @username + space
    const newValue = beforeMention + `@${user.userName} ` + afterCursor
    
    // Thêm vào mentions list
    const newMentions = [...mentions]
    if (!newMentions.find(m => m.id === user.id)) {
      newMentions.push(user)
    }
    setMentions(newMentions)
    
    onChange(newValue, newMentions)
    setShowDropdown(false)
    setMentionQuery('')
    setMentionStartPos(-1)
    
    // Focus lại input
    setTimeout(() => {
      const newCursorPos = beforeMention.length + user.userName.length + 2
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Xử lý key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || friends.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % friends.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + friends.length) % friends.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (showDropdown && friends[selectedIndex]) {
        e.preventDefault()
        selectUser(friends[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
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
      
      {/* Dropdown gợi ý - dùng Portal để không bị che */}
      {showDropdown && inputRef.current && createPortal(
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
                  index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => selectUser(user)}
                onMouseEnter={() => setSelectedIndex(index)}
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
    </div>
  )
}

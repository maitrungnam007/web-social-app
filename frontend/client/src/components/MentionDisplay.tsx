import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendsApi } from '../services'
import { MentionUser } from '../types'

interface MentionDisplayProps {
  content: string
  className?: string
}

// Component hiển thị content với mention (@username) màu xanh và hashtag (#tag) màu xanh dương
export default function MentionDisplay({ content, className = '' }: MentionDisplayProps) {
  const [friends, setFriends] = useState<MentionUser[]>([])
  const navigate = useNavigate()

  // Load danh sách bạn bè một lần để kiểm tra mention
  useEffect(() => {
    friendsApi.searchFriendsForMention('')
      .then(res => {
        if (res.success && res.data) {
          setFriends(res.data)
        }
      })
      .catch(() => {})
  }, [])

  // Render content với mention và hashtag được style
  const renderContent = () => {
    if (!content) return null

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    // Pattern match cả @username và #hashtag
    const pattern = /(@\w+|#\w+)/g
    let match

    while ((match = pattern.exec(content)) !== null) {
      // Text trước match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        )
      }

      const matchedText = match[0]
      
      if (matchedText.startsWith('@')) {
        // Mention @username
        const username = matchedText.substring(1)
        const mentionedUser = friends.find(f => f.userName.toLowerCase() === username.toLowerCase())

        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`cursor-pointer ${
              mentionedUser 
                ? 'text-blue-500 hover:text-blue-600 font-medium' 
                : 'text-gray-400'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (mentionedUser) {
                navigate(`/profile/${mentionedUser.id}`)
              }
            }}
          >
            @{username}
          </span>
        )
      } else if (matchedText.startsWith('#')) {
        // Hashtag #tag
        const tag = matchedText.substring(1)
        parts.push(
          <span
            key={`hashtag-${match.index}`}
            className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/hashtag/${tag}`)
            }}
          >
            #{tag}
          </span>
        )
      }

      lastIndex = match.index + matchedText.length
    }

    // Text sau match cuối
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      )
    }

    return parts.length > 0 ? parts : content
  }

  return (
    <span className={className}>
      {renderContent()}
    </span>
  )
}

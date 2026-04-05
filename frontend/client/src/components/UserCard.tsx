import { User } from '../types'

interface UserCardProps {
  user: User
  onAction?: () => void
  actionText?: string
  actionVariant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
}

export default function UserCard({ 
  user, 
  onAction, 
  actionText,
  actionVariant = 'primary',
  onClick 
}: UserCardProps) {
  const actionStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <img
        src={user.avatarUrl 
          ? `http://localhost:5259/api/files/${user.avatarUrl}` 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random&size=48`}
        alt={user.userName}
        className="w-12 h-12 rounded-full"
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.userName}
        </p>
        <p className="text-sm text-gray-500 truncate">@{user.userName}</p>
      </div>

      {actionText && onAction && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAction()
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${actionStyles[actionVariant]}`}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

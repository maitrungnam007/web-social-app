import { Friendship } from '../types'
import toast from 'react-hot-toast'

interface FriendRequestItemProps {
  friendship: Friendship
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  type: 'received' | 'sent'
}

export default function FriendRequestItem({ 
  friendship, 
  onAccept, 
  onReject,
  onCancel,
  type 
}: FriendRequestItemProps) {
  // Dùng thông tin từ Friendship trực tiếp
  const userName = type === 'received' ? friendship.requesterName : friendship.addresseeName
  const userAvatar = type === 'received' ? friendship.requesterAvatar : friendship.addresseeAvatar
  const userId = type === 'received' ? friendship.requesterId : friendship.addresseeId

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
      <img
        src={userAvatar 
          ? `http://localhost:5259/api/files/${userAvatar}` 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random&size=48`}
        alt={userName || ''}
        className="w-12 h-12 rounded-full"
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {userName}
        </p>
        <p className="text-sm text-gray-500 truncate">@{userName}</p>
      </div>

      {type === 'received' && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.promise(
                onAccept?.() || Promise.resolve(),
                {
                  loading: 'Đang chấp nhận...',
                  success: 'Đã chấp nhận lời mời kết bạn',
                  error: 'Không thể chấp nhận'
                }
              )
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
          >
            Chấp nhận
          </button>
          <button
            onClick={() => {
              toast.promise(
                onReject?.() || Promise.resolve(),
                {
                  loading: 'Đang từ chối...',
                  success: 'Đã từ chối lời mời',
                  error: 'Không thể từ chối'
                }
              )
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Từ chối
          </button>
        </div>
      )}

      {type === 'sent' && (
        <button
          onClick={() => {
            toast.promise(
              onCancel?.() || Promise.resolve(),
              {
                loading: 'Đang hủy...',
                success: 'Đã hủy lời mời kết bạn',
                error: 'Không thể hủy'
              }
            )
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
        >
          Hủy lời mời
        </button>
      )}
    </div>
  )
}

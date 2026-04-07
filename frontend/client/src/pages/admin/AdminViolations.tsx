import { useState, useEffect } from 'react'
import { usersApi } from '../../services'
import { User } from '../../types'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminViolations() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [showBannedOnly, setShowBannedOnly] = useState(false)
  
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    userId: '',
    action: 'ban' as 'ban' | 'unban',
    banReason: ''
  })

  useEffect(() => {
    loadUsers()
  }, [page, showBannedOnly])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await usersApi.getAllUsers(page, pageSize, search || undefined)
      if (response.success && response.data) {
        setUsers(response.data.items)
        setTotalCount(response.data.totalCount)
      }
    } catch (error) {
      toast.error('Không thê tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleBan = (userId: string, userName: string) => {
    const reason = prompt('Nhập lý do cấm:')
    if (!reason) return
    
    setConfirm({
      isOpen: true,
      title: 'Cấm nguời dùng',
      message: `Bạnn có chắc muốn cấm nguời dùng "${userName}"?`,
      userId,
      action: 'ban',
      banReason: reason
    })
  }

  const executeAction = async () => {
    const { userId, action, banReason } = confirm
    setConfirm(prev => ({ ...prev, isOpen: false }))
    
    try {
      if (action === 'ban') {
        await usersApi.banUser(userId, banReason)
        toast.success('Ðã cấm nguời dùng')
      } else {
        await usersApi.unbanUser(userId)
        toast.success('Ðã gỡ cấm nguời dùng')
      }
      loadUsers()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vi phạm</h1>
        <p className="text-gray-500 mt-1">Danh sách nguời dùng vi phạm và lịch sử</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm nguời dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBannedOnly}
              onChange={(e) => { setShowBannedOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Chỉ hiển thị đã cấm</span>
          </label>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tim kiem
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Tổng vi phạm</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ðang bị cấm</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Cần xử lý</p>
          <p className="text-2xl font-bold text-yellow-600">0</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Ðang tải...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nguời dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số vi phạm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do cấm</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={user.role === 'Admin' ? 'bg-purple-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl ? `http://localhost:5259/api/files/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || user.userName)}&background=random`}
                        alt={user.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.userName}</p>
                        <p className="text-sm text-gray-500">@{user.userName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      0
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'Admin' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {user.role !== 'Admin' && (
                      <button
                        onClick={() => handleBan(user.id, user.userName)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cam
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Hi?n th? <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> trong{' '}
                <span className="font-medium">{totalCount}</span> kết quả
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.action === 'ban' ? 'Cấm' : 'Gỡ cấm'}
        confirmVariant={confirm.action === 'ban' ? 'danger' : 'primary'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

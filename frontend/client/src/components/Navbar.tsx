import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            InteractHub
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <input
              type="search"
              placeholder="Tìm kiếm..."
              className="px-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Link>

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
        </div>
      </div>
    </nav>
  )
}

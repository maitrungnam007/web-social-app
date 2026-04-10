import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAvatarUrl } from '../utils/avatar'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Kiểm tra quyền admin
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/')
    }
  }, [user, navigate])

  if (!user || user.role !== 'Admin') {
    return null
  }

  const handleLogout = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Bạn có chắc muốn đăng xuất?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id)
              logout()
              navigate('/login')
              toast.success('Đã đăng xuất')
            }}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Đăng xuất
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    })
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { to: '/admin/users', label: 'Người dùng', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { to: '/admin/content', label: 'Nội dung', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { to: '/admin/moderation', label: 'Kiểm duyệt', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A5.934 5.934 0 0112 2.944a5.934 5.934 0 01-5.618 4.04A5.934 5.934 0 012.944 12a5.934 5.934 0 014.04 5.618A5.934 5.934 0 0112 21.056a5.934 5.934 0 015.618-4.04A5.934 5.934 0 0121.056 12a5.934 5.934 0 00-4.04-5.618z" />
      </svg>
    )},
    { to: '/admin/violations', label: 'Vi phạm', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )},
    { to: '/admin/settings', label: 'Cài đặt', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white p-3 z-50 flex items-center justify-between">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${mobileMenuOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64
      `}>
        {/* Header voi toggle button */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-400">InteractHub</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-2 border-t border-gray-700 ${sidebarCollapsed ? 'px-1' : ''}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3 px-2">
                <img
                  src={getAvatarUrl(user.avatarUrl, user.firstName, user.lastName, user.userName, 40)}
                  alt={user.userName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{user.firstName || user.userName}</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <img
                src={getAvatarUrl(user.avatarUrl, user.firstName, user.lastName, user.userName, 32)}
                alt={user.userName}
                className="w-8 h-8 rounded-full"
                title={user.firstName || user.userName}
              />
              <button
                onClick={handleLogout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        transition-all duration-300 p-6
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        pt-16 lg:pt-6
      `}>
        <Outlet />
      </main>
    </div>
  )
}

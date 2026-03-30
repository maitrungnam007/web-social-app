import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()

  const menuItems = [
    { icon: 'home', label: 'Trang chủ', path: '/' },
    { icon: 'user', label: 'Hồ sơ', path: `/profile/${user?.id}` },
    { icon: 'users', label: 'Bạn bè', path: '/friends' },
    { icon: 'camera', label: 'Tin', path: '/stories' },
    { icon: 'bell', label: 'Thông báo', path: '/notifications' },
  ]

  const icons: Record<string, JSX.Element> = {
    home: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    user: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    users: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    camera: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bell: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg hidden md:block">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-100 rounded-lg">
          <img
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.userName}&background=random`}
            alt={user?.userName}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">@{user?.userName}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {icons[item.icon]}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

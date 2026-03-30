import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-blue-600">
            InteractHub
          </Link>
          <p className="text-gray-500 mt-2">Kết nối với bạn bè</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

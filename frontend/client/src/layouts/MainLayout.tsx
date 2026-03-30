import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:ml-64 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

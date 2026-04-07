import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSkeleton from './components/LoadingSkeleton'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Stories = lazy(() => import('./pages/Stories'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Friends = lazy(() => import('./pages/Friends'))
const PostDetail = lazy(() => import('./pages/PostDetail'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminContent = lazy(() => import('./pages/admin/AdminContent'))
const AdminViolations = lazy(() => import('./pages/admin/AdminViolations'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSkeleton variant="circular" width={48} height={48} className="mx-auto" />
        <p className="text-gray-500">Đang tải...</p>
      </div>
    </div>
  )
}

// Scroll restoration component
function ScrollRestoration() {
  const location = useLocation()
  
  // Save scroll position continuously while on home page
  useEffect(() => {
    if (location.pathname !== '/') return
    
    const handleScroll = () => {
      sessionStorage.setItem('scrollPosition', String(window.scrollY))
    }
    
    // Save on scroll
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])
  
  // Restore scroll position when coming back to home
  useEffect(() => {
    if (location.pathname === '/') {
      const savedPosition = sessionStorage.getItem('scrollPosition')
      if (savedPosition) {
        // Wait longer for content to load (infinite scroll needs time)
        const timer = setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition))
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [location.pathname])
  
  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        } />
      </Route>
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="profile/:userId?" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="stories" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Stories />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="friends" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Friends />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="post/:id" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PostDetail />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<PageLoader />}>
            <AdminUsers />
          </Suspense>
        } />
        <Route path="content" element={
          <Suspense fallback={<PageLoader />}>
            <AdminContent />
          </Suspense>
        } />
        <Route path="moderation" element={
          <Suspense fallback={<PageLoader />}>
            <AdminModeration />
          </Suspense>
        } />
        <Route path="violations" element={
          <Suspense fallback={<PageLoader />}>
            <AdminViolations />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <AdminSettings />
          </Suspense>
        } />
      </Route>
    </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 1000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
              duration: 1000,
            },
            error: {
              style: {
                background: '#ef4444',
              },
              duration: 3000,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

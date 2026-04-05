interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  className?: string
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200'
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-lg'
  }

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '100px')
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

// Post Skeleton
export function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-1">
          <LoadingSkeleton variant="text" width="30%" />
          <LoadingSkeleton variant="text" width="20%" height={12} />
        </div>
      </div>
      <LoadingSkeleton variant="text" height={60} />
      <LoadingSkeleton variant="rectangular" height={200} />
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton variant="rectangular" height={192} className="rounded-t-lg" />
      <div className="bg-white rounded-b-lg shadow p-6">
        <div className="flex items-end gap-4 -mt-20">
          <LoadingSkeleton variant="circular" width={128} height={128} className="border-4 border-white" />
          <div className="flex-1 space-y-2 pb-2">
            <LoadingSkeleton variant="text" width="40%" height={24} />
            <LoadingSkeleton variant="text" width="30%" height={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

// User Card Skeleton
export function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
      <LoadingSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="60%" />
        <LoadingSkeleton variant="text" width="40%" height={12} />
      </div>
    </div>
  )
}

// Notification Skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b">
      <LoadingSkeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-1">
        <LoadingSkeleton variant="text" width="80%" />
        <LoadingSkeleton variant="text" width="30%" height={12} />
      </div>
    </div>
  )
}

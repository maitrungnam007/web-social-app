import { Story, StoryHighlight } from '../types'

interface ProfileHighlightsProps {
  stories: Story[]
  highlights: StoryHighlight[]
  userName?: string
  userAvatar?: string
  onViewStory: (story: Story) => void
  onViewHighlight: (highlight: StoryHighlight) => void
}

export default function ProfileHighlights({
  stories,
  highlights,
  userName,
  userAvatar,
  onViewStory,
  onViewHighlight
}: ProfileHighlightsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Tin nổi bật</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {/* Story mới (trong 24h) */}
        {stories.length > 0 && (
          <div
            onClick={() => onViewStory(stories[0])}
            className="flex-shrink-0 w-28 h-48 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition overflow-hidden relative"
          >
            {stories[0].mediaUrl ? (
              <img
                src={`http://localhost:5259/api/files/${stories[0].mediaUrl}`}
                alt="Story"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-purple-400 to-pink-400 flex items-center justify-center p-2">
                <p className="text-white text-xs text-center line-clamp-4">
                  {stories[0].content}
                </p>
              </div>
            )}

            <div className="absolute top-2 left-2">
              <div className={`w-10 h-10 rounded-full p-0.5 ${stories[0].isViewedByCurrentUser ? 'bg-gray-300' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
                <img
                  src={userAvatar ? `http://localhost:5259/api/files/${userAvatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || '')}&background=random&size=40`}
                  alt={userName || ''}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium drop-shadow">
                {userName}
              </p>
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            onClick={() => onViewHighlight(highlight)}
            className="flex-shrink-0 w-28 h-48 bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition overflow-hidden relative"
          >
            {highlight.coverImageUrl || highlight.stories[0]?.mediaUrl ? (
              <img
                src={`http://localhost:5259/api/files/${highlight.coverImageUrl || highlight.stories[0]?.mediaUrl}`}
                alt={highlight.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-green-400 to-blue-400 flex items-center justify-center p-2">
                <p className="text-white text-xs text-center line-clamp-4">
                  {highlight.name}
                </p>
              </div>
            )}

            {/* Highlight Icon */}
            <div className="absolute top-2 left-2">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-green-400 to-blue-500">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium drop-shadow truncate">
                {highlight.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

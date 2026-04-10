import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostItem from "../components/PostItem.tsx";
import CreatePostModal from "../components/CreatePostModal.tsx";
import { postsApi } from "../services";
import { Post } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarUrl } from "../utils/avatar";

const PAGE_SIZE = 5;

export default function Home() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const hashtagQuery = searchParams.get('hashtag') || '';
    const [posts, setPosts] = useState<Post[]>([]);
    const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
    const [page, setPage] = useState(() => {
        // Restore page from sessionStorage
        const savedPage = sessionStorage.getItem('homePage');
        return savedPage ? parseInt(savedPage) : 1;
    });
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createMode, setCreateMode] = useState<'image' | 'hashtag' | undefined>(undefined);
    // Flag de tranh chay 2 lan trong React StrictMode
    const isLoadingRef = useRef(false);

    // Fetch danh sách bài viết đã ẩn
    const fetchHiddenPosts = async () => {
        if (!user) return;
        try {
            const response = await postsApi.getHiddenPosts();
            if (response.success && response.data) {
                setHiddenPostIds(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch hidden posts:', err);
        }
    };

    const fetchPosts = async (pageNum: number) => {
        if (loading) return;
        setLoading(true);

        try {
            const response = await postsApi.getPosts(pageNum, PAGE_SIZE, searchQuery || undefined, hashtagQuery || undefined);

            if (response.success && response.data) {
                const newPosts = response.data.items || [];
                if (newPosts.length < PAGE_SIZE) setHasMore(false);
                // Filter để tránh duplicate posts
                setPosts((prev) => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            } else {
                console.error('Failed to fetch posts:', response.message);
            }
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    // Load all pages that were previously loaded
    useEffect(() => {
        let isMounted = true;
        
        const loadAllPages = async () => {
            // Tranh chay 2 lan trong React StrictMode
            if (isLoadingRef.current) return;
            isLoadingRef.current = true;
            
            const savedPage = sessionStorage.getItem('homePage');
            const targetPage = savedPage ? parseInt(savedPage) : 1;
            
            // Fetch hidden posts first
            await fetchHiddenPosts();
            
            for (let p = 1; p <= targetPage; p++) {
                if (!isMounted) break;
                await fetchPosts(p);
            }
            
            if (isMounted) {
                setInitialLoad(false);
            }
            
            // Restore scroll position after content is loaded
            const savedPosition = sessionStorage.getItem('scrollPosition');
            if (savedPosition && isMounted) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedPosition));
                }, 100);
            }
        };
        
        loadAllPages();
        
        return () => {
            isMounted = false;
            isLoadingRef.current = false;
        };
    }, []);

    // Reload posts when search query or hashtag changes
    useEffect(() => {
        if (initialLoad) return; // Skip khi dang load ban dau
        
        setPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, hashtagQuery]);

    // Load more on page change (after initial load)
    useEffect(() => {
        if (initialLoad || page === 1) return; // Skip khi dang load ban dau hoac page 1
        
        fetchPosts(page);
        sessionStorage.setItem('homePage', String(page));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 200 &&
                hasMore &&
                !loading
            ) {
                setPage((prev) => prev + 1);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore]);

    // Xử lý khi bài viết bị xóa - reload lại danh sách
    const handlePostDelete = async (postId: number) => {
        // Xóa bài viết khỏi danh sách hiện tại
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        // Reset và load lại từ đầu
        setPage(1);
        setHasMore(true);
        setPosts([]);
        await fetchPosts(1);
    };

    return (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pt-20 sm:pt-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {hashtagQuery ? `#${hashtagQuery}` : searchQuery ? `Ket qua tim kiem: "${searchQuery}"` : 'Bảng tin'}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {hashtagQuery 
                        ? `Hiển thị bài viết với hashtag #${hashtagQuery}`
                        : searchQuery 
                            ? `Hiển thị bài viết chứa "${searchQuery}"`
                            : ``
                    }
                </p>
            </div>

            {/* Create Post Card */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img
                        src={getAvatarUrl(user?.avatarUrl, user?.firstName, user?.lastName, user?.userName, 40)}
                        alt="Avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <button 
                        className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-500 transition-colors text-sm sm:text-base"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Bạn đang nghĩ gì?
                    </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => {
                            setCreateMode('image');
                            setShowCreateModal(true);
                        }}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Ảnh</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => {
                            setCreateMode('hashtag');
                            setShowCreateModal(true);
                        }}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="hidden sm:inline">Hashtag</span>
                    </button>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3 sm:space-y-4">
                {posts.map((post) => (
                    <PostItem key={post.id} post={post} hiddenPostIds={hiddenPostIds} onPostDelete={handlePostDelete} />
                ))}
            </div>

            {/* Loading & End States */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    Đã hiển thị tất cả bài viết
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <p className="text-gray-500">
                        {hashtagQuery ? `Khong co bai viet voi #${hashtagQuery}` : searchQuery ? `Khong tim thay bai viet voi "${searchQuery}"` : 'Chưa có bài viết nào'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        {hashtagQuery ? 'Thử tìm kiếm hashtag khác' : searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy là người đầu tiên đăng bài!'}
                    </p>
                </div>
            )}

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal 
                    onClose={() => {
                        setShowCreateModal(false);
                        setCreateMode(undefined);
                    }}
                    onSuccess={() => {
                        // Reload posts after creating
                        setPosts([]);
                        setPage(1);
                        setHasMore(true);
                        fetchPosts(1);
                    }}
                    initialMode={createMode}
                />
            )}
        </div>
    );
}
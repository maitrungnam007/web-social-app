import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Post } from "../types";
import { postsApi } from "../services";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Comments from "./Comments.tsx";
import ReportModal from "./ReportModal.tsx";
import MentionDisplay from "./MentionDisplay.tsx";
import { getAvatarUrl } from "../utils/avatar";

interface Props {
    post: Post;
    hiddenPostIds?: number[]; // Danh sách ID bài viết đã ẩn từ parent
    onPostDelete?: (postId: number) => void; // Callback khi xóa bài viết
}

export default function PostItem({ post, hiddenPostIds, onPostDelete }: Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [liking, setLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [hiding, setHiding] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Check nếu là chủ bài viết
    const isOwner = user?.id === post.userId;

    // Check nếu bài viết đã bị ẩn
    useEffect(() => {
        if (hiddenPostIds && hiddenPostIds.includes(post.id)) {
            setIsHidden(true);
        }
    }, [hiddenPostIds, post.id]);

    // Ẩn bài viết
    const handleHide = async () => {
        if (hiding) return;
        setHiding(true);
        try {
            const result = await postsApi.hidePost(post.id);
            if (result.success) {
                setIsHidden(true);
                toast.success("Đã ẩn bài viết");
            } else {
                toast.error(result.message || "Không thể ẩn bài viết");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        }
        setHiding(false);
        setShowMenu(false);
    };

    // Bỏ ẩn bài viết
    const handleUnhide = async () => {
        if (hiding) return;
        setHiding(true);
        try {
            const result = await postsApi.unhidePost(post.id);
            if (result.success) {
                setIsHidden(false);
                toast.success("Đã bỏ ẩn bài viết");
            } else {
                toast.error(result.message || "Không thể bỏ ẩn bài viết");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        }
        setHiding(false);
    };

    // Xóa bài viết
    const handleDelete = async () => {
        if (deleting) return;

        // Sử dụng toast confirm thay vì window.confirm
        toast(
            (t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-medium">Bạn có chắc muốn xóa bài viết này?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                setDeleting(true);
                                try {
                                    const result = await postsApi.deletePost(post.id);
                                    if (result.success) {
                                        toast.success("Đã xóa bài viết");
                                        onPostDelete?.(post.id);
                                    } else {
                                        toast.error(result.message || "Không thể xóa bài viết");
                                    }
                                } catch (error) {
                                    toast.error("Có lỗi xảy ra");
                                }
                                setDeleting(false);
                                setShowMenu(false);
                            }}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            if (isLiked) {
                await postsApi.unlikePost(post.id);
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                await postsApi.likePost(post.id);
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
        } catch (error) {
            toast.error("Không thể thực hiện");
        }
        setLiking(false);
    };

    const formatTime = (dateString: string) => {
        // Backend gửi giờ không có timezone, cần thêm 'Z' để JavaScript hiểu là UTC
        const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        // Hiển thị chi tiết theo thời gian
        if (seconds < 10) return "Vừa xong";
        if (seconds < 60) return `${seconds} giây trước`;
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        // Hiển thị ngày giờ cụ thể cho bài viết cũ hơn 1 tuần
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const displayName = post.userFirstName && post.userLastName 
        ? `${post.userFirstName} ${post.userLastName}` 
        : post.userName;
    const avatarUrl = getAvatarUrl(post.userAvatar, post.userFirstName, post.userLastName, post.userName, 40);

    return (
        <div className="bg-white rounded-lg shadow-md mb-3 sm:mb-4 overflow-hidden hover:shadow-lg transition-shadow">
            {/* UI khi bài viết bị ẩn */}
            {isHidden ? (
                <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3 text-gray-500">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <span className="text-xs sm:text-sm">Bài viết đã bị ẩn</span>
                        </div>
                        <button
                            onClick={handleUnhide}
                            disabled={hiding}
                            className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm font-medium disabled:opacity-50"
                        >
                            {hiding ? "Đang xử lý..." : "Hoàn tác"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 pb-2">
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => navigate(`/profile/${post.userId}`)}
                        />
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer text-sm sm:text-base truncate"
                                onClick={() => navigate(`/profile/${post.userId}`)}
                            >
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
                        </div>
                        <div className="relative flex-shrink-0">
                            <button 
                                className="text-gray-400 hover:text-gray-600 p-1"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                            
                            {/* Menu dropdown */}
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                                        {/* Nút xóa - chỉ hiển thị cho chủ bài viết */}
                                        {isOwner && (
                                            <button
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                onClick={handleDelete}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Xóa bài viết
                                            </button>
                                        )}
                                        <button
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            onClick={() => {
                                                setShowReportModal(true);
                                                setShowMenu(false);
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                            Báo cáo bài viết
                                        </button>
                                        <button
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            onClick={handleHide}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                            Ẩn bài viết
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-3 sm:px-4 pb-2">
                        <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">
                            <MentionDisplay content={post.content} />
                        </p>
                    </div>

                    {/* Image */}
                    {post.imageUrl && (
                        <div className="relative">
                            <img
                                src={post.imageUrl.startsWith("http")
                                    ? post.imageUrl
                                    : `http://localhost:5259/api/files/${post.imageUrl}`}
                                alt="Post image"
                                className="w-full max-h-64 sm:max-h-96 object-cover"
                            />
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 border-t">
                        <span>{likeCount} lượt thích</span>
                        <span
                            className="cursor-pointer hover:text-gray-700"
                            onClick={() => setShowComments(!showComments)}
                        >
                            {post.commentCount} bình luận
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center border-t">
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 hover:bg-gray-50 transition-colors text-sm sm:text-base ${
                                isLiked ? "text-red-500" : "text-gray-500"
                            }`}
                        >
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                fill={isLiked ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <span className="font-medium hidden sm:inline">{isLiked ? "Đã thích" : "Thích"}</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 text-gray-500 hover:bg-gray-50 transition-colors border-l text-sm sm:text-base"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <span className="font-medium hidden sm:inline">Bình luận</span>
                        </button>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="border-t bg-gray-50 p-3 sm:p-4">
                            <Comments postId={post.id} />
                        </div>
                    )}

                    {/* Modal báo cáo */}
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        targetType="post"
                        targetId={post.id}
                        targetName={displayName}
                    />
                </>
            )}
        </div>
    );
}
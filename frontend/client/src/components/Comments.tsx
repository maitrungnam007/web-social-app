import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { commentsApi } from "../services";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import ReportModal from "./ReportModal";

interface Comment {
    id: number;
    content: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
    likeCount: number;
    parentCommentId?: number;
    replies?: Comment[];
    isLikedByCurrentUser?: boolean;
}

interface Props {
    postId: number;
}

export default function Comments({ postId }: Props) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [replyText, setReplyText] = useState("");
    const [likingComments, setLikingComments] = useState<Set<number>>(new Set());
    const [showMenuFor, setShowMenuFor] = useState<number | null>(null);
    const [reportComment, setReportComment] = useState<Comment | null>(null);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await commentsApi.getCommentsByPost(postId);
            if (response.success && response.data) {
                setComments(response.data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const addComment = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            const response = await commentsApi.createComment({ postId, content: text });
            if (response.success && response.data) {
                setComments(prev => [response.data!, ...prev]);
                setText("");
                toast.success("Đã bình luận");
            }
        } catch (err) {
            toast.error("Không thể bình luận");
        }
        setSubmitting(false);
    };

    const addReply = async (parentComment: Comment) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const response = await commentsApi.createComment({
                postId,
                content: replyText,
                parentCommentId: parentComment.id
            });
            if (response.success && response.data) {
                // Add reply to the parent comment's replies
                setComments(prev => prev.map(c => {
                    if (c.id === parentComment.id) {
                        return {
                            ...c,
                            replies: [...(c.replies || []), response.data!]
                        };
                    }
                    return c;
                }));
                setReplyText("");
                setReplyTo(null);
                toast.success("Đã trả lời");
            }
        } catch (err) {
            toast.error("Không thể trả lời");
        }
        setSubmitting(false);
    };

    const handleLikeComment = async (comment: Comment) => {
        if (likingComments.has(comment.id)) return;
        setLikingComments(prev => new Set(prev).add(comment.id));

        try {
            await commentsApi.likeComment(comment.id);
            // Update comment's like count and isLiked status
            const updateComment = (c: Comment): Comment => {
                if (c.id === comment.id) {
                    return {
                        ...c,
                        likeCount: c.isLikedByCurrentUser ? c.likeCount - 1 : c.likeCount + 1,
                        isLikedByCurrentUser: !c.isLikedByCurrentUser
                    };
                }
                if (c.replies) {
                    return { ...c, replies: c.replies.map(updateComment) };
                }
                return c;
            };
            setComments(prev => prev.map(updateComment));
        } catch (err) {
            toast.error("Không thể thích bình luận");
        }

        setLikingComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(comment.id);
            return newSet;
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    const getAvatarUrl = (comment: Comment) => {
        return comment.userAvatar
            ? comment.userAvatar.startsWith("http")
                ? comment.userAvatar
                : `http://localhost:5259/api/files/${comment.userAvatar}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=random&size=32`;
    };

    const renderComment = (comment: Comment, isReply: boolean = false) => (
        <div key={comment.id} className={`flex gap-2 ${isReply ? 'ml-10' : ''}`}>
            <img
                src={getAvatarUrl(comment)}
                alt={comment.userName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${comment.userId}`)}
            />
            <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-3 py-2 relative group">
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/profile/${comment.userId}`)}
                        >
                            {comment.userName}
                        </p>
                        {/* Nút 3 chấm */}
                        <button
                            className="text-gray-400 hover:text-gray-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowMenuFor(showMenuFor === comment.id ? null : comment.id)}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        {showMenuFor === comment.id && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenuFor(null)} />
                                <div className="absolute right-2 top-8 w-36 bg-white rounded-lg shadow-lg border z-20 py-1">
                                    <button
                                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        onClick={() => {
                                            setReportComment(comment);
                                            setShowMenuFor(null);
                                        }}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                        Báo cáo
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-2 text-xs text-gray-500">
                    <span>{formatTime(comment.createdAt)}</span>
                    {comment.likeCount > 0 && (
                        <span>• {comment.likeCount} lượt thích</span>
                    )}
                    <button
                        className={`hover:text-blue-500 font-medium ${comment.isLikedByCurrentUser ? 'text-blue-500' : ''}`}
                        onClick={() => handleLikeComment(comment)}
                        disabled={likingComments.has(comment.id)}
                    >
                        {comment.isLikedByCurrentUser ? 'Đã thích' : 'Thích'}
                    </button>
                    <button
                        className="hover:text-blue-500 font-medium"
                        onClick={() => setReplyTo(comment)}
                    >
                        Trả lời
                    </button>
                </div>

                {/* Reply Input */}
                {replyTo?.id === comment.id && (
                    <div className="flex items-start gap-2 mt-2 ml-2">
                        <img
                            src={user?.avatarUrl
                                ? `http://localhost:5259/api/files/${user.avatarUrl}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.userName || 'User')}&background=random&size=24`}
                            alt="Your avatar"
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 flex gap-2">
                            <input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addReply(comment)}
                                placeholder={`Trả lời ${comment.userName}...`}
                                className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                disabled={submitting}
                                autoFocus
                            />
                            <button
                                onClick={() => addReply(comment)}
                                disabled={submitting || !replyText.trim()}
                                className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                Gửi
                            </button>
                            <button
                                onClick={() => { setReplyTo(null); setReplyText(""); }}
                                className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Comment Input */}
            <div className="flex items-start gap-2">
                <img
                    src={user?.avatarUrl
                        ? `http://localhost:5259/api/files/${user.avatarUrl}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.userName || 'User')}&background=random&size=32`}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addComment()}
                        placeholder="Viết bình luận..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        disabled={submitting}
                    />
                    {text.trim() && (
                        <button
                            onClick={addComment}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            Gửi
                        </button>
                    )}
                </div>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            ) : comments.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                    Chưa có bình luận nào
                </p>
            ) : (
                <div className="space-y-3 pt-2">
                    {comments.map(comment => renderComment(comment))}
                </div>
            )}
            {/* Modal báo cáo bình luận */}
            <ReportModal
                isOpen={!!reportComment}
                onClose={() => setReportComment(null)}
                targetType="comment"
                targetId={reportComment?.id || 0}
                targetName={reportComment?.userName}
            />
        </div>
    );
}
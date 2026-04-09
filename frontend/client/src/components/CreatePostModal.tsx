import { useState, useRef, useEffect } from "react";
import { postsApi, filesApi } from "../services";
import toast from "react-hot-toast";
import MentionInput from "./MentionInput";
import { MentionUser } from "../types";

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialMode?: 'image' | 'hashtag';
}

export default function CreatePostModal({ onClose, onSuccess, initialMode }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [mentions, setMentions] = useState<MentionUser[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasOpenedFilePicker = useRef(false);

    // Tu dong mo file picker hoac them # khi modal mo voi initialMode
    useEffect(() => {
        // Chi chay 1 lan, tranh chay 2 lan trong React StrictMode
        if (hasOpenedFilePicker.current) return;
        
        if (initialMode === 'image') {
            hasOpenedFilePicker.current = true;
            // Delay de modal render xong
            setTimeout(() => {
                fileInputRef.current?.click();
            }, 100);
        } else if (initialMode === 'hashtag') {
            setContent('#');
        }
    }, [initialMode]);

    // Xử lý thay đổi content với mentions
    const handleContentChange = (newContent: string, newMentions: MentionUser[]) => {
        setContent(newContent);
        setMentions(newMentions);
    };

    // Xử lý chọn file ảnh
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Kiểm tra loại file
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh");
                return;
            }
            // Kiểm tra kích thước (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước ảnh tối đa 5MB");
                return;
            }
            setSelectedFile(file);
            // Tạo preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Xóa ảnh đã chọn
    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Nội dung không được để trống");
            return;
        }

        if (content.length > 5000) {
            toast.error("Nội dung tối đa 5000 ký tự");
            return;
        }

        setLoading(true);
        try {
            let imageUrl: string | undefined;

            // Upload ảnh nếu có
            if (selectedFile) {
                const uploadResult = await filesApi.uploadFile(selectedFile, 'posts');
                if (uploadResult.success && uploadResult.data) {
                    imageUrl = uploadResult.data.fileUrl;
                } else {
                    toast.error("Không thể tải ảnh lên");
                    setLoading(false);
                    return;
                }
            }

            // Extract hashtags từ content (#tag)
            const hashtagMatches = content.match(/#\w+/g);
            const hashtags = hashtagMatches 
                ? hashtagMatches.map(tag => tag.substring(1)) // Bỏ dấu #
                : [];

            // Lay danh sach user ID tu mentions
            const mentionedUserIds = mentions.map(m => m.id);

            // Tạo bài viết
            const result = await postsApi.createPost({ 
                content, 
                imageUrl,
                hashtags,
                mentionedUserIds
            });
            
            if (result.success) {
                toast.success("Đăng bài thành công!");
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Đăng bài thất bại");
            }
        } catch (error: any) {
            // Lay error message tu API response
            const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra";
            toast.error(errorMessage);
        }
        setLoading(false);
    };

    // Cleanup preview URL khi unmount
    const handleClose = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Tạo bài viết</h2>

                {/* Preview ảnh */}
                {previewUrl && (
                    <div className="relative mb-4">
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content Input */}
                <MentionInput
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Bạn đang nghĩ gì? Gõ @ để nhắc bạn bè"
                    className="h-32 mb-4"
                />

                {/* File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg mb-4 text-gray-500 hover:border-blue-500 hover:text-blue-500"
                >
                    {selectedFile ? 'Đổi hình ảnh' : '+ Thêm hình ảnh'}
                </button>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 text-white rounded-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {loading ? 'Đang đăng...' : 'Đăng bài'}
                    </button>
                </div>
            </div>
        </div>
    );
}
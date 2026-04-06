import { useState, useRef } from "react";
import { postsApi, filesApi } from "../services";
import toast from "react-hot-toast";
import MentionInput from "./MentionInput";
import { MentionUser } from "../types";

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [mentions, setMentions] = useState<MentionUser[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            // Tạo bài viết
            const result = await postsApi.createPost({ 
                content, 
                imageUrl,
                hashtags 
            });
            
            if (result.success) {
                toast.success("Đăng bài thành công!");
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Đăng bài thất bại");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Tạo bài viết</h2>
                    <button 
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <MentionInput
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Bạn đang nghĩ gì? Gõ @ để nhắc bạn bè"
                        className="h-32"
                    />
                    
                    {/* Preview ảnh */}
                    {previewUrl && (
                        <div className="mt-3 relative">
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-h-64 rounded-lg object-cover w-full"
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

                    {/* Nút chọn ảnh */}
                    <div className="mt-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                        >
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {selectedFile ? "Thay đổi ảnh" : "Thêm ảnh"}
                        </button>
                        {selectedFile && (
                            <span className="ml-2 text-sm text-gray-500">
                                {selectedFile.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Đang đăng..." : "Đăng"}
                    </button>
                </div>
            </div>
        </div>
    );
}
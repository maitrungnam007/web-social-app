import { useState } from "react";
import { postService } from "../services/postService";

export default function CreatePostModal({ onClose, onSuccess }: any) {
    const [content, setContent] = useState("");
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");

    // xử lý ảnh preview
    const handleImageChange = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError("Không được để trống");
            return;
        }

        if (content.length > 300) {
            setError("Tối đa 300 ký tự");
            return;
        }

        const hashtags = content.match(/#\w+/g) || [];

        try {
            await postService.createPost({
                content,
                imageUrl: preview,
                hashtags,
            });

            onSuccess();
            onClose();
        } catch {
            setError("Đăng bài thất bại");
        }
    };

    return (
        <div className="modal">
            <h2>Tạo bài viết</h2>

            <textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContent(e.target.value)
                }
                placeholder="Bạn đang nghĩ gì?"
            />

            <input
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files[0]) {
                        handleImageChange(e.target.files[0]);
                    }
                }}
            />

            {preview && <img src={preview} alt="preview" width={200} />}

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={handleSubmit}>Đăng</button>
            <button onClick={onClose}>Hủy</button>
        </div>
    );
}
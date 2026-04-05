import { useState } from "react";
import { postService } from "../services/postService";

export default function CreatePostModal({ onClose, onSuccess }: any) {
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");

    // preview ảnh
    const handleImageChange = (file: File) => {
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        // VALIDATION
        if (!content.trim()) {
            setError("Không được để trống nội dung");
            return;
        }

        if (content.length > 300) {
            setError("Tối đa 300 ký tự");
            return;
        }

        // lấy hashtag
        const hashtags = content.match(/#\w+/g) || [];

        try {
            await postService.createPost({
                content,
                imageUrl: preview, // demo (backend thật thì upload riêng)
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
                placeholder="Bạn đang nghĩ gì?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <input
                type="file"
                onChange={(e) =>
                    e.target.files && handleImageChange(e.target.files[0])
                }
            />

            {preview && <img src={preview} width={200} />}

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={handleSubmit}>Đăng</button>
            <button onClick={onClose}>Hủy</button>
        </div>
    );
}
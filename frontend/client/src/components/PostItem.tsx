import { Post } from "../types/post.ts";
import Comments from "./Comments.tsx";

interface Props {
    post: Post;
}

export default function PostItem({ post }: Props) {
    return (
        <div
            style={{
                border: "1px solid #ccc",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
            }}
        >
            {/* Nội dung bài viết */}
            <p style={{ fontSize: "16px" }}>{post.content}</p>

            {/* Ảnh (nếu có) */}
            {post.imageUrl && (
                <img
                    src={post.imageUrl}
                    alt="post"
                    style={{
                        width: "100%",
                        maxWidth: "300px",
                        marginTop: "8px",
                        borderRadius: "6px",
                    }}
                />
            )}

            {/* Thời gian */}
            {post.createdAt && (
                <p style={{ fontSize: "12px", color: "#888" }}>
                    {new Date(post.createdAt).toLocaleString()}
                </p>
            )}

            {/* Comments */}
            <div style={{ marginTop: "10px" }}>
                <Comments postId={post.id} />
            </div>
        </div>
    );
}
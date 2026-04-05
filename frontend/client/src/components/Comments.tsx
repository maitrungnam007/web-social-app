import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function Comments({ postId }: any) {
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        setLoading(true);

        try {
            const res = await fetch(
                `${API_URL}/comments/post/${postId}`
            );
            const data = await res.json();
            setComments(data);
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

        const res = await fetch(`${API_URL}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, content: text }),
        });

        const newComment = await res.json();

        setComments((prev) => [...prev, newComment]);
        setText("");
    };

    return (
        <div>
            <h4>Bình luận</h4>

            {loading && <p>Đang tải comment...</p>}

            {comments.map((c) => (
                <p key={c.id}>{c.content}</p>
            ))}

            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Viết bình luận..."
            />

            <button onClick={addComment}>Gửi</button>
        </div>
    );
}
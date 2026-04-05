import { useEffect, useState } from "react";
import PostItem from "../components/PostItem";
import { postService } from "../services/postService";

const PAGE_SIZE = 5;

export default function Home() {
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const data = await postService.getPosts(page, PAGE_SIZE);

            if (data.length < PAGE_SIZE) setHasMore(false);

            setPosts((prev) => [...prev, ...data]);
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
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

    return (
        <div>
            <h1>Feed</h1>

            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}

            {loading && <p>Đang tải...</p>}
            {!hasMore && <p>Hết bài</p>}
        </div>
    );
}
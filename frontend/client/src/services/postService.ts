const API_URL = "http://localhost:5000/api";

export const postService = {
    async getPosts(page: number, pageSize: number) {
        const res = await fetch(
            `${API_URL}/posts?page=${page}&pageSize=${pageSize}`
        );
        return res.json();
    },

    async createPost(data: {
        content: string;
        imageUrl?: string;
        hashtags?: string[];
    }) {
        const res = await fetch(`${API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        return res.json();
    },
};
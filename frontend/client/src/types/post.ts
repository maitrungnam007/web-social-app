export interface Comment {
    id: number;
    postId: number;
    content: string;
    createdAt?: string;
}

export interface Post {
    id: number;
    content: string;
    imageUrl?: string;
    createdAt?: string;
    comments?: Comment[];
}
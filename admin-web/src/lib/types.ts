export interface UserProfile {
    id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    level: number;
    is_verified: boolean;
    bio?: string;
    created_at?: any;
    email?: string;
    followers_count?: number;
    following_count?: number;
}

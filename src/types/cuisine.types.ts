import { LucideIcon } from 'lucide-react-native';

export type Cuisine = {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
    gradient: [string, string];
    count: number; // For display purposes, though we'll fetch real data
    tagFilter: string; // The tag to filter by in Firestore
};

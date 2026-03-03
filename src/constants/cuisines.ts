import { Bike, Coffee, Fish, Flame, Leaf, Pizza, Soup, UtensilsCrossed } from 'lucide-react-native';
import { Cuisine } from '../types/cuisine.types';

export const CUISINE_CATALOGUE: Cuisine[] = [
    {
        id: 'turkish',
        name: 'Türk Mutfağı',
        icon: UtensilsCrossed,
        description: 'Kebaplar, pideler, zeytinyağlılar ve dahası',
        gradient: ['#C0513A', '#8B2500'],
        count: 125,
        tagFilter: 'turkish',
    },
    {
        id: 'italian',
        name: 'İtalyan',
        icon: Pizza,
        description: 'Gerçek makarna ve pizza deneyimi',
        gradient: ['#1A5E3A', '#0D3621'],
        count: 84,
        tagFilter: 'italian',
    },
    {
        id: 'asian',
        name: 'Uzak Doğu',
        icon: Soup,
        description: 'Sushi, noodle ve egzotik lezzetler',
        gradient: ['#D62828', '#780116'],
        count: 67,
        tagFilter: 'asian',
    },
    {
        id: 'mexican',
        name: 'Meksika',
        icon: Flame,
        description: 'Taco, burrito ve bol acılı soslar',
        gradient: ['#F4A261', '#E76F51'],
        count: 42,
        tagFilter: 'mexican',
    },
    {
        id: 'vegan',
        name: 'Vegan & Vejetaryen',
        icon: Leaf,
        description: 'Bitki bazlı, sağlıklı ve hafif tarifler',
        gradient: ['#588157', '#344e41'],
        count: 53,
        tagFilter: 'vegan',
    },
    {
        id: 'seafood',
        name: 'Deniz Ürünleri',
        icon: Fish,
        description: 'Taze balıklar ve denizden gelen şifa',
        gradient: ['#457B9D', '#1D3557'],
        count: 29,
        tagFilter: 'seafood',
    },
    {
        id: 'street',
        name: 'Sokak Lezzetleri',
        icon: Bike,
        description: 'Hızlı, doyurucu ve klasik sokak ruhu',
        gradient: ['#FFD166', '#F78C6B'],
        count: 91,
        tagFilter: 'street',
    },
    {
        id: 'dessert',
        name: 'Tatlı Dünyası',
        icon: Coffee,
        description: 'Mutluluk veren şerbetli ve sütlü tatlılar',
        gradient: ['#FFB7C5', '#FF8C94'],
        count: 76,
        tagFilter: 'dessert',
    },
];

export const getCuisineById = (id: string): Cuisine | undefined =>
    CUISINE_CATALOGUE.find(c => c.id === id);

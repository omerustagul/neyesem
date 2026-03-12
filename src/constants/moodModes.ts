import { MoodMode } from '../types/mood.types';

export const MOOD_MODES: MoodMode[] = [
    {
        id: 'mac_gecesi',
        name: 'Maç Gecesi',
        emoji: '⚽',
        icon: 'Gamepad2',
        description: 'Eller bulaşmadan, paylaşımlık atıştırmalıklar',
        gradient: ['#C0513A', '#8B2500'],
        vector: {
            ortam: ['mac_gecesi', 'arkadas_bulusmasi'],
            zaman: ['aksam', 'gece'],
            enerji: ['kolay_hazirlanir', 'hizli'],
            duygu: ['heyecan', 'semarlik'],
            keywords: [
                'cips', 'nachos', 'söğüş', 'finger food', 'atıştırmalık',
                'kanat', 'nugget', 'dip sos', 'meze', 'çerez', 'pizza', 'bira',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
        dynamicTrigger: {
            hours: [18, 19, 20, 21, 22],
            days: [5, 6],  // Cuma, Cumartesi
        },
    },
    {
        id: 'gece_yarisi',
        name: 'Gece Yarısı Açlığı',
        emoji: '🌙',
        icon: 'Moon',
        description: 'Gece yarısı gelen o tatlı veya tuzlu krizleri',
        gradient: ['#1A1A1D', '#4E4E50'],
        vector: {
            ortam: ['gece_yarisi', 'yalniz_gece'],
            zaman: ['gece'],
            enerji: ['hizli', 'hazir', 'kolay_hazirlanir'],
            duygu: ['semarlik', 'konfor'],
            keywords: [
                'gece', 'açlık', 'krizi', 'şipşak', 'mikrodalga',
                'tost', 'makarna', 'atıştırmalık', 'nutella', 'çikolata', 'sandviç',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
        dynamicTrigger: {
            hours: [23, 0, 1, 2, 3],
        },
    },
    {
        id: 'aci_meydan_okuma',
        name: 'Acıya Meydan Okuma',
        emoji: '🌶️',
        icon: 'Flame',
        description: 'Ağızları yoran ama vazgeçilmeyen acı lezzetler',
        gradient: ['#FF0000', '#B22222'],
        vector: {
            ortam: ['arkadas_bulusmasi', 'yalniz_gece'],
            zaman: ['ogle', 'aksam'],
            enerji: ['gosteris_ister'],
            duygu: ['aci_meydan_okuma', 'heyecan'],
            keywords: [
                'acı', 'isot', 'pul biber', 'jalapeno', 'acı sos',
                'wasabi', 'challenge', 'meydan okuma', 'acı biber', 'tabasco',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
    },
    {
        id: 'film_gecesi',
        name: 'Film Gecesi',
        emoji: '🍿',
        icon: 'Popcorn',
        description: 'Ekran başında keyifle atıştırılacaklar',
        gradient: ['#F9D423', '#FF4E50'],
        vector: {
            ortam: ['film_gecesi', 'yalniz_gece', 'romantik_aksam'],
            zaman: ['aksam', 'gece'],
            enerji: ['hizli', 'kolay_hazirlanir'],
            duygu: ['konfor', 'semarlik'],
            keywords: [
                'patlamış mısır', 'popcorn', 'cips', 'meyve tabağı', 'kurabiye',
                'dizi', 'film', 'sinema', 'atıştırmalık', 'kraker',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
        dynamicTrigger: {
            hours: [20, 21, 22, 23],
        },
    },
    {
        id: 'hasta_yatagi',
        name: 'Hasta Yatağında',
        emoji: '🍵',
        icon: 'HeartPulse',
        description: 'İyileştiren, şifa veren sıcacık tarifler',
        gradient: ['#DAE2F8', '#D6A4A4'],
        vector: {
            ortam: ['hasta_yatagi', 'yalniz_gece'],
            zaman: ['sabah', 'ogle', 'aksam', 'gece'],
            enerji: ['kolay_hazirlanir', 'uzun_pisirme'],
            duygu: ['konfor', 'saglikli'],
            keywords: [
                'çorba', 'şifa', 'grip', 'soğuk algınlığı', 'nane limon',
                'tavuk suyu', 'kelle paça', 'ıhlamur', 'bitki çayı', 'zencefil',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
    },
    {
        id: 'pazar_keyfi',
        name: 'Pazar Keyfi',
        emoji: '☀️',
        icon: 'Sun',
        description: 'Mangal, sofra hazırlığı, bolca vakit',
        gradient: ['#F4A418', '#C0513A'],
        vector: {
            ortam: ['pazar_keyfi', 'aile_sofrasi', 'arkadas_bulusmasi'],
            zaman: ['ogle', 'hafta_sonu'],
            enerji: ['uzun_pisirme', 'gosteris_ister'],
            duygu: ['konfor', 'nostalji'],
            keywords: [
                'mangal', 'et', 'köfte', 'izgara', 'barbekü',
                'pide', 'salata', 'cacık', 'mevsim', 'kebap',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
        dynamicTrigger: {
            hours: [10, 11, 12, 13, 14],
            days: [0],  // Pazar
        },
    },
    {
        id: 'romantik_aksam',
        name: 'Romantik Akşam',
        emoji: '🕯️',
        icon: 'Heart',
        description: 'İkili sofra, özenli sunum, şık tarifler',
        gradient: ['#8B2563', '#C0513A'],
        vector: {
            ortam: ['romantik_aksam'],
            zaman: ['aksam'],
            enerji: ['gosteris_ister'],
            duygu: ['semarlik', 'heyecan'],
            keywords: [
                'pasta', 'risotto', 'çikolata', 'sufle', 'şarap',
                'salmon', 'karidesli', 'krem sos', 'candle light', 'tatlı',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
        dynamicTrigger: {
            hours: [19, 20, 21],
            isHoliday: true,
        },
    },
    {
        id: 'saglikli_yasam',
        name: 'Sağlıklı Yaşam',
        emoji: '🥗',
        icon: 'Salad',
        description: 'Hafif, besleyici, dengeli tarifler',
        gradient: ['#3B4A2F', '#8FA67A'],
        vector: {
            ortam: ['yalniz_gece', 'ofis_ogle'],
            zaman: ['sabah', 'ogle'],
            enerji: ['kolay_hazirlanir', 'hizli'],
            duygu: ['saglikli'],
            keywords: [
                'salata', 'detoks', 'light', 'düşük kalori', 'vegan',
                'glutensiz', 'sebze', 'kinoa', 'taze', 'diyet',
            ],
            weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
        },
    },
];

// ID ile mod bul
export const getMoodById = (id: string): MoodMode | undefined =>
    MOOD_MODES.find(m => m.id === id);

export type SeasonalFood = {
    name: string;
    emoji: string;
    type: 'fruit' | 'vegetable' | 'fish';
    description: string;
    months: number[]; // 1-12
};

export const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const SEASONAL_DATA: SeasonalFood[] = [
    // Vegetables
    { name: 'Enginar', emoji: '🥬', type: 'vegetable', description: 'Karaciğer dostu, taze enginar mevsimi.', months: [3, 4, 5, 6] },
    { name: 'Patlıcan', emoji: '🍆', type: 'vegetable', description: 'Közlemelik en iyi patlıcanlar.', months: [6, 7, 8, 9] },
    { name: 'Balkabağı', emoji: '🎃', type: 'vegetable', description: 'Vitamin deposu kış lezzeti.', months: [10, 11, 12, 1] },
    { name: 'Kuşkonmaz', emoji: '🌿', type: 'vegetable', description: 'Baharın gelişini müjdeleyen lezzet.', months: [3, 4, 5] },
    { name: 'Pırasa', emoji: '🥒', type: 'vegetable', description: 'Zeytinyağlı sofraların vazgeçilmezi.', months: [11, 12, 1, 2] },
    { name: 'Ispanak', emoji: '🥬', type: 'vegetable', description: 'Demir deposu kış yeşilliği.', months: [10, 11, 12, 1, 2, 3] },
    { name: 'Biber', emoji: '🌶️', type: 'vegetable', description: 'Dolmalık ve sivri biber mevsimi.', months: [6, 7, 8, 9] },
    { name: 'Kabak', emoji: '🥒', type: 'vegetable', description: 'Mücver ve dolma zamanı.', months: [5, 6, 7, 8] },
    { name: 'Kereviz', emoji: '🥬', type: 'vegetable', description: 'Zeytinyağlı kereviz sezonu.', months: [11, 12, 1, 2] },
    { name: 'Domates', emoji: '🍅', type: 'vegetable', description: 'Olgunlaşmış taze yerli domates.', months: [6, 7, 8, 9] },

    // Fruits
    { name: 'Çilek', emoji: '🍓', type: 'fruit', description: 'Mis kokulu taze yerli çilekler.', months: [4, 5, 6] },
    { name: 'İncir', emoji: '🫐', type: 'fruit', description: 'Ballı taze incir mevsimi.', months: [8, 9] },
    { name: 'Nar', emoji: '🫐', type: 'fruit', description: 'Antioksidan deposu nar zamanı.', months: [9, 10, 11] },
    { name: 'Portakal', emoji: '🍊', type: 'fruit', description: 'C vitamini kaynağı kış meyvesi.', months: [11, 12, 1, 2, 3] },
    { name: 'Mandalina', emoji: '🍊', type: 'fruit', description: 'Tatlı ve sulu kış keyfi.', months: [11, 12, 1, 2] },
    { name: 'Karpuz', emoji: '🍉', type: 'fruit', description: 'Yaz serinliğinin simgesi.', months: [6, 7, 8] },
    { name: 'Kayısı', emoji: '🍑', type: 'fruit', description: 'Malatyanın altın meyvesi.', months: [6, 7] },
    { name: 'Kiraz', emoji: '🍒', type: 'fruit', description: 'Baharın kırmızı mücevheri.', months: [5, 6] },
    { name: 'Elma', emoji: '🍎', type: 'fruit', description: 'Sonbaharın taze elmaları.', months: [9, 10, 11] },
    { name: 'Ayva', emoji: '🍐', type: 'fruit', description: 'Sonbahar tatlılarının yıldızı.', months: [10, 11] },

    // Fish
    { name: 'Kalkan', emoji: '🐟', type: 'fish', description: 'Boğazın en lezzetli zamanı.', months: [2, 3, 4, 5] },
    { name: 'Hamsi', emoji: '🐟', type: 'fish', description: 'Karadenizin incisi hamsi sezonu.', months: [11, 12, 1, 2] },
    { name: 'Lüfer', emoji: '🐟', type: 'fish', description: 'Sonbaharın sultanı lüfer av sezonu.', months: [9, 10, 11] },
    { name: 'Palamut', emoji: '🐟', type: 'fish', description: 'Izgara palamut zamanı.', months: [9, 10, 11] },
    { name: 'İstavrit', emoji: '🐟', type: 'fish', description: 'Tava istavrit keyfi.', months: [3, 4, 5, 6] },
    { name: 'Levrek', emoji: '🐟', type: 'fish', description: 'Yaz sofrasının zarif balığı.', months: [6, 7, 8, 9] },
    { name: 'Mezgit', emoji: '🐟', type: 'fish', description: 'Kış sofralarının taze balığı.', months: [12, 1, 2, 3] },
    { name: 'Sardalya', emoji: '🐟', type: 'fish', description: 'Yaz aylarının ızgara lezzeti.', months: [6, 7, 8] },
];

export const seasonService = {
    getAllFoods: () => SEASONAL_DATA,

    getFoodsForMonth: (month?: number) => {
        const currentMonth = month || new Date().getMonth() + 1;
        return SEASONAL_DATA.filter(food => food.months.includes(currentMonth));
    },

    getFoodsByTypeForMonth: (month?: number) => {
        const foods = seasonService.getFoodsForMonth(month);
        return {
            vegetables: foods.filter(f => f.type === 'vegetable'),
            fruits: foods.filter(f => f.type === 'fruit'),
            fish: foods.filter(f => f.type === 'fish'),
        };
    },

    getCurrentSeasonName: () => {
        const month = new Date().getMonth() + 1;
        if ([12, 1, 2].includes(month)) return 'Kış';
        if ([3, 4, 5].includes(month)) return 'İlkbahar';
        if ([6, 7, 8].includes(month)) return 'Yaz';
        return 'Sonbahar';
    },

    getSeasonForMonth: (month: number) => {
        if ([12, 1, 2].includes(month)) return 'Kış';
        if ([3, 4, 5].includes(month)) return 'İlkbahar';
        if ([6, 7, 8].includes(month)) return 'Yaz';
        return 'Sonbahar';
    },

    getSeasonColor: (season: string) => {
        switch (season) {
            case 'Kış': return '#60a5fa';
            case 'İlkbahar': return '#34d399';
            case 'Yaz': return '#fbbf24';
            case 'Sonbahar': return '#f97316';
            default: return '#94a3b8';
        }
    },

    getSeasonEmoji: (season: string) => {
        switch (season) {
            case 'Kış': return '❄️';
            case 'İlkbahar': return '🌸';
            case 'Yaz': return '☀️';
            case 'Sonbahar': return '🍂';
            default: return '🌿';
        }
    }
};

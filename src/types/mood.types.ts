// Tüm mood sistemi tip tanımları

export type MoodOrtam =
    | 'mac_gecesi'
    | 'pazar_keyfi'
    | 'romantik_aksam'
    | 'arkadas_bulusmasi'
    | 'yalniz_gece'
    | 'aile_sofrasi'
    | 'bayram_sofrasi'
    | 'ofis_ogle'
    | 'gece_yarisi'
    | 'film_gecesi'
    | 'hasta_yatagi';

export type MoodZaman =
    | 'sabah'
    | 'ogle'
    | 'aksam'
    | 'gece'
    | 'hafta_sonu'
    | 'ozel_gun';

export type MoodEnerji =
    | 'kolay_hazirlanir'
    | 'gosteris_ister'
    | 'hizli'
    | 'uzun_pisirme'
    | 'hazir';

export type MoodDuygu =
    | 'konfor'
    | 'heyecan'
    | 'nostalji'
    | 'saglikli'
    | 'semarlik'
    | 'aci_meydan_okuma';

export type MoodVector = {
    ortam: MoodOrtam[];
    zaman: MoodZaman[];
    enerji: MoodEnerji[];
    duygu: MoodDuygu[];
    keywords: string[];
    weights: {
        keyword: number;   // 0.40
        ortam: number;     // 0.25
        zaman: number;     // 0.15
        enerji: number;    // 0.10
        duygu: number;     // 0.10
    };
};

export type MoodMode = {
    id: string;
    name: string;
    emoji: string;
    icon?: string;  // Lucide icon name
    description: string;
    gradient: [string, string];   // Kart gradyan renkleri
    vector: MoodVector;
    dynamicTrigger?: DynamicTrigger;
};

export type DynamicTrigger = {
    hours?: number[];       // Hangi saatlerde öner (0-23)
    days?: number[];        // Hangi günlerde öner (0=Pazar, 6=Cumartesi)
    isHoliday?: boolean;    // Özel günde öner
};

// Firestore post dökümanına eklenecek mood alanları
export type PostMoodTags = {
    ortam: MoodOrtam[];
    zaman: MoodZaman[];
    enerji: MoodEnerji[];
    duygu: MoodDuygu[];
    moodScores: Record<string, number>;   // { mac_gecesi: 0.92, pazar_keyfi: 0.15, ... }
    isTagged: boolean;                    // Cloud Function tamamladı mı?
};

// Kullanıcının mod seçim geçmişi (kişiselleştirme için)
export type MoodLog = {
    moodId: string;
    selectedAt: string;
    dayOfWeek: number;
    hour: number;
};

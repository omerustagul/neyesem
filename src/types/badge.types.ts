export type BadgeId =
    | 'ilk_yorum' | 'ilk_gonderi' | 'ilk_begeni'
    | 'ilk_kayit' | 'profil_tamam' | 'damak_atesi'
    | 'lezzet_gezgini' | 'dede_ocagi' | 'gece_kusu'
    | 'zincir_ustasi' | 'mahalle_bakkali' | 'el_uzatmis'
    | 'duyurdum_sana' | 'cirak_mezun' | 'trend_kiran'
    | 'hiz_sefi' | 'devamli_ates' | 'dolap_dedektifi'
    | 'yayinci_ruh' | 'soframin_efendisi';

export type BadgeGroup =
    | 'baslangic'
    | 'yemek_kulturu'
    | 'sosyal'
    | 'ustalik';

export type Badge = {
    id: BadgeId;
    emoji: string;          // Kept for legacy — not rendered in UI
    icon: string;           // lucide-react-native icon name
    iconColor: string;      // Primary accent color for the icon
    iconBg: string;         // Background color (rgba) for the badge frame
    name: string;
    title: string;          // Rozet başlığı — profilde italik gösterilir
    description: string;    // Koşul açıklaması
    group: BadgeGroup;
    xpReward: number;
    isSecret: boolean;      // true ise kazanılana kadar görünmez
};

export type UserBadge = {
    badgeId: BadgeId;
    earnedAt: string;       // ISO string
    postId?: string;        // Rozeti kazandıran gönderi (varsa)
};

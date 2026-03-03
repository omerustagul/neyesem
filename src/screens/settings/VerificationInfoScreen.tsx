import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    BadgeCheck,
    Check,
    ChefHat,
    Crown,
    Globe,
    Lock,
    ShieldCheck,
    Sparkles,
    Star,
    Trophy,
    Users,
    Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { useBadgeInfoStore } from '../../store/badgeInfoStore';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

// ─── Condition row ─────────────────────────────────────────────────────────────
const Condition = ({
    icon: Icon,
    title,
    desc,
    iconColor,
}: {
    icon: React.ComponentType<any>;
    title: string;
    desc: string;
    iconColor: string;
}) => {
    const { theme, typography, isDark } = useTheme();
    return (
        <View style={[condStyles.row, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[condStyles.iconBox, { backgroundColor: iconColor + '1A' }]}>
                <Icon size={20} color={iconColor} strokeWidth={2} />
            </View>
            <View style={condStyles.text}>
                <Text style={[condStyles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    {title}
                </Text>
                <Text style={[condStyles.desc, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {desc}
                </Text>
            </View>
            <Check size={16} color={iconColor} strokeWidth={2.5} />
        </View>
    );
};

const condStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: { flex: 1 },
    title: { fontSize: 14, marginBottom: 2 },
    desc: { fontSize: 12, lineHeight: 17 },
});

// ─── Perk pill ─────────────────────────────────────────────────────────────────
const Perk = ({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) => {
    const { theme, typography, isDark } = useTheme();
    return (
        <View style={[perkStyles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)' }]}>
            <Icon size={14} color="#f59e0b" strokeWidth={2} />
            <Text style={[perkStyles.label, { color: theme.text, fontFamily: typography.body }]}>{label}</Text>
        </View>
    );
};

const perkStyles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    label: { fontSize: 12 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const VerificationInfoScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { theme, typography, isDark } = useTheme();

    // Pulse animation for the hero badge
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        );
        pulse.start();
        glow.start();
        return () => { pulse.stop(); glow.stop(); };
    }, []);

    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    const conditions = [
        {
            icon: ChefHat,
            title: 'Gerçek bir şef veya gastronom',
            desc: 'Profesyonel mutfak geçmişin ya da gastronomi alanında uzmanlığın olmalı.',
            iconColor: '#f59e0b',
        },
        {
            icon: Users,
            title: 'Aktif topluluk üyesi',
            desc: 'Düzenli içerik üreten, takipçileriyle etkileşime giren hesaplar.',
            iconColor: '#3b82f6',
        },
        {
            icon: Globe,
            title: 'Kamuya mal olmuş kişi veya marka',
            desc: 'Basın, medya veya gastronomi sektöründe tanınan bir isim ya da marka.',
            iconColor: '#8b5cf6',
        },
        {
            icon: ShieldCheck,
            title: 'Kimlik doğrulaması',
            desc: 'Yetkili ulusal kimlik belgesi veya kurum belgesiyle kimliğini doğrula.',
            iconColor: '#10b981',
        },
        {
            icon: Star,
            title: 'Otantik hesap',
            desc: 'Gerçek bir kişiyi veya markayı temsil eden tek ve orijinal hesap.',
            iconColor: '#ec4899',
        },
    ];

    const perks = [
        { icon: BadgeCheck, label: 'Doğrulama rozeti' },
        { icon: Crown, label: 'Altın kullanıcı adı' },
        { icon: Trophy, label: 'Öncelikli destek' },
        { icon: Sparkles, label: 'Öne çıkarılma' },
        { icon: Zap, label: 'Hızlı yükseklik' },
        { icon: Lock, label: 'Hesap koruması' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Back button */}
            <View style={[styles.headerBar, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

                {/* ── Hero ── */}
                <View style={styles.hero}>
                    {/* Animated glow ring */}
                    <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

                    {/* Badge container with touchable to trigger info popup */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => useBadgeInfoStore.getState().showBadgeInfo('verification')}
                    >
                        <Animated.View style={[styles.heroBadgeContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b', '#d97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.heroBadge}
                            >
                                <VerificationBadge size={44} disabled />
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>

                    <Text style={[styles.heroTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Doğrulanmış Rozet
                    </Text>
                    <Text style={[styles.heroSub, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Kimliğini kanıtla, topluluğun güvenini kazan ve{'\n'}uygulamadaki en güçlü statüyü elde et.
                    </Text>
                </View>

                {/* ── Perks ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        ROZETLE NELER KAZANIYORSUN
                    </Text>
                    <View style={styles.perksWrap}>
                        {perks.map((p, i) => (
                            <Perk key={i} icon={p.icon} label={p.label} />
                        ))}
                    </View>
                </View>

                {/* ── Conditions ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        KİMLER ALABİLİR
                    </Text>
                    <BlurView
                        intensity={isDark ? 18 : 10}
                        tint={isDark ? 'dark' : 'light'}
                        style={[styles.condCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}
                    >
                        {conditions.map((c, i) => (
                            <Condition key={i} icon={c.icon} title={c.title} desc={c.desc} iconColor={c.iconColor} />
                        ))}
                    </BlurView>
                </View>

                {/* ── OR divider ── */}
                <View style={styles.orRow}>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <Text style={[styles.orText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        veya
                    </Text>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                </View>

                {/* ── Subscribe section ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        ANINDA ROZET AL
                    </Text>

                    <View style={[styles.subscribeCard, { borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(217,119,6,0.2)', backgroundColor: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(251,191,36,0.06)' }]}>
                        <View style={styles.subscribeTop}>
                            <View style={styles.subscribeLeft}>
                                <Text style={[styles.subscribeTitle, { color: theme.text, fontFamily: typography.display }]}>
                                    neyesem Pro
                                </Text>
                                <Text style={[styles.subscribeDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Aylık abonelik • İstediğin zaman iptal
                                </Text>
                            </View>
                            <View style={styles.priceBox}>
                                <Text style={[styles.priceMain, { fontFamily: typography.display }]}>₺249</Text>
                                <Text style={[styles.priceCent, { fontFamily: typography.body }]}>,90/ay</Text>
                            </View>
                        </View>

                        {/* Feature list */}
                        {['Doğrulanmış rozet ve altın kullanıcı adı', 'Öncelikli içerik keşfi ve öne çıkarılma', '7/24 öncelikli müşteri desteği', 'Hesabına ekstra koruma katmanı'].map((feat, i) => (
                            <View key={i} style={styles.featRow}>
                                <View style={styles.featDot} />
                                <Text style={[styles.featText, { color: theme.text, fontFamily: typography.body }]}>
                                    {feat}
                                </Text>
                            </View>
                        ))}

                        {/* CTA button */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.ctaWrapper}
                            onPress={() => {
                                // TODO: connect to payment provider (RevenueCat / İyzico)
                            }}
                        >
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b', '#d97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                <BadgeCheck size={20} color="#fff" strokeWidth={2.3} />
                                <Text style={[styles.ctaText, { fontFamily: typography.bodyMedium }]}>
                                    Şimdi Abone Ol — ₺249,90/ay
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={[styles.legalNote, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Abonelik, App Store / Google Play hesabından yönetilir. İlk ödeme hemen alınır.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBar: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Hero
    hero: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 32,
        paddingHorizontal: 28,
    },
    glowRing: {
        position: 'absolute',
        top: 4,
        width: 130,
        height: 130,
        borderRadius: 70,
        backgroundColor: '#f59e0b',
    },
    heroBadgeContainer: {
        marginBottom: 22,
    },
    heroBadge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    heroTitle: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSub: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },

    // Sections
    section: { paddingHorizontal: 16, marginBottom: 8 },
    sectionLabel: {
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 8,
    },

    // Perks
    perksWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    // Conditions card
    condCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },

    // OR divider
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginVertical: 20,
        gap: 12,
    },
    divider: { flex: 1, height: 0.5 },
    orText: { fontSize: 13 },

    // Subscribe card
    subscribeCard: {
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 20,
        gap: 0,
    },
    subscribeTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    subscribeLeft: { flex: 1 },
    subscribeTitle: { fontSize: 20, marginBottom: 4 },
    subscribeDesc: { fontSize: 12 },
    priceBox: { flexDirection: 'row', alignItems: 'flex-end' },
    priceMain: { fontSize: 28, color: '#f59e0b' },
    priceCent: { fontSize: 14, color: '#f59e0b', marginBottom: 4 },

    featRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    featDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f59e0b',
    },
    featText: { fontSize: 13, flex: 1 },

    // CTA
    ctaWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
            },
            android: { elevation: 8 },
        }),
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    ctaText: {
        color: '#fff',
        fontSize: 15,
    },
    legalNote: {
        fontSize: 11,
        lineHeight: 16,
        textAlign: 'center',
        marginTop: 12,
    },
});

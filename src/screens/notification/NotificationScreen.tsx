import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Archive, ArrowLeft, Bell, CheckCircle, Heart, MessageCircle, Star, UserPlus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { AppNotification, useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const NotificationScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { notifications, setupListener, markAsRead } = useNotificationStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!user) return;
        const unsubscribe = setupListener(user.uid);
        return () => unsubscribe();
    }, [user]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={16} color={colors.spiceRed} fill={colors.spiceRed} />;
            case 'comment': return <MessageCircle size={16} color={theme.text} />;
            case 'follow': return <UserPlus size={16} color="#3b82f6" />;
            case 'system': return <Bell size={16} color={colors.saffron} />;
            case 'archive': return <Archive size={16} color={theme.secondaryText} />;
            case 'success': return <CheckCircle size={16} color="#22c55e" />;
            case 'list': return <Star size={16} color={colors.saffron} fill={colors.saffron} />;
            case 'level_up': return <Star size={16} color="#f59e0b" fill="#f59e0b" />;
            case 'xp_gained': return <Star size={16} color={colors.mintFresh} />;
            default: return <Bell size={16} color={colors.saffron} />;
        }
    };

    const renderNotificationItem = ({ item }: { item: AppNotification }) => {
        const isSystem = item.type === 'system' || !item.sender;
        const isFollow = item.type === 'follow';

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                        borderColor: item.is_read ? 'transparent' : `${colors.saffron}20`,
                        borderWidth: 1,
                    },
                ]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.contentRow}>
                    <View style={styles.leftSection}>
                        {isSystem ? (
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(20,133,74,0.15)' : 'rgba(20,133,74,0.08)' }]}>
                                {getIcon(item.type)}
                            </View>
                        ) : (
                            <View style={styles.avatarWrapper}>
                                <View style={[styles.avatar, { backgroundColor: colors.glassBorder }]}>
                                    <Text style={[styles.avatarLabel, { color: theme.text }]}>
                                        {item.sender?.username?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                                <View style={[styles.typeBadge, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                                    {getIcon(item.type)}
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.mainSection}>
                        <View style={styles.textRow}>
                            {!isSystem && (
                                <Text style={[styles.username, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                    {item.sender?.username}{' '}
                                </Text>
                            )}
                            <Text style={[styles.bodyText, { color: isSystem ? theme.text : theme.secondaryText, fontFamily: typography.body, fontSize: 13 }]}>
                                {item.body}
                                <Text style={[styles.timeText, { color: theme.secondaryText, fontSize: 11, opacity: 0.6 }]}>
                                    {'  '}{formatDistanceToNow(new Date(item.created_at), { locale: tr }).replace('yaklaşık ', '')}
                                </Text>
                            </Text>
                        </View>
                    </View>

                    {isFollow && (
                        <TouchableOpacity style={[styles.followBtn, { backgroundColor: colors.saffron }]}>
                            <Text style={[styles.followBtnText, { fontFamily: typography.bodyMedium }]}>Takip Et</Text>
                        </TouchableOpacity>
                    )}

                    {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.saffron }]} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Custom Header with Back Button */}
            <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.display }]}>
                    Bildirimler
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    notifications.length > 0 ? (
                        <View style={styles.headerSpacer}>
                            <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                SON BİLDİRİMLER
                            </Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                            <Bell size={32} color={theme.secondaryText} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            Henüz bildirim yok
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Beğeni, yorum ve takip bildirimleri burada görünecek.
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
    },
    listPadding: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        paddingTop: 16,
    },
    headerSpacer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        letterSpacing: 1.2,
    },
    notificationCard: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftSection: {
        marginRight: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        width: 44,
        height: 44,
        position: 'relative',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    typeBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    mainSection: {
        flex: 1,
    },
    textRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 18,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.7,
    },
    followBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    followBtnText: {
        color: '#fff',
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 17,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

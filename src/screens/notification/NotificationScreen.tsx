import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Archive, Bell, CheckCircle, Heart, MessageCircle, Star, UserPlus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification, useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const MOCK_NOTIFICATIONS: AppNotification[] = [
    {
        id: '1',
        type: 'follow',
        body: 'sizi takip etmeye başladı.',
        is_read: false,
        created_at: new Date().toISOString(),
        recipient_id: '1',
        sender: { username: 'omerustagul', avatar_url: '' }
    },
    {
        id: '2',
        type: 'system',
        body: 'Profil bilgileriniz başarıyla güncellendi.',
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        recipient_id: '1'
    },
    {
        id: '3',
        type: 'like',
        body: 'gönderinizi beğendi.',
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        recipient_id: '1',
        sender: { username: 'ceylan_gurme', avatar_url: '' }
    },
    {
        id: '4',
        type: 'list',
        body: '"Favori Lezzetler" listeniz başarıyla oluşturuldu.',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        recipient_id: '1'
    }
];

export const NotificationScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
    const displayNotifications = notifications.length > 0 ? notifications : MOCK_NOTIFICATIONS;
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={16} color={colors.spiceRed} fill={colors.spiceRed} />;
            case 'comment': return <MessageCircle size={16} color={theme.text} />;
            case 'follow': return <UserPlus size={16} color="#3b82f6" />;
            case 'system': return <Bell size={16} color={colors.saffron} />;
            case 'archive': return <Archive size={16} color={theme.secondaryText} />;
            case 'success': return <CheckCircle size={16} color="#22c55e" />;
            case 'list': return <Star size={16} color={colors.saffron} fill={colors.saffron} />;
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
                                {item.sender?.avatar_url ? (
                                    <View style={styles.avatar}>
                                        <Text style={[styles.avatarLabel, { color: theme.text }]}>
                                            {item.sender?.username?.[0]?.toUpperCase()}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={[styles.avatar, { backgroundColor: colors.glassBorder }]}>
                                        <Text style={[styles.avatarLabel, { color: theme.text }]}>
                                            {item.sender?.username?.[0]?.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
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
            <FlatList
                data={displayNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                contentContainerStyle={[
                    styles.listPadding,
                    { paddingTop: headerHeight + 20 }
                ]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.headerSpacer}>
                        <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            SON BİLDİRİMLER
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Bell size={32} color={theme.secondaryText} />
                        </View>
                        <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            Henüz bir bildiriminiz yok.
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
    listPadding: {
        paddingHorizontal: 16,
        paddingBottom: 100,
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
        backgroundColor: '#fff',
        width: 20,
        height: 20,
        borderRadius: 10,
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
        borderRadius: 8,
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
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(128,128,128,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 15,
    },
});

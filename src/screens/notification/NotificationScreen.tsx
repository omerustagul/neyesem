import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification, useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

// Mock notifications for testing
const MOCK_NOTIFICATIONS: AppNotification[] = [
    {
        id: '1',
        type: 'like',
        body: 'senin gönderine beğeni koydu',
        is_read: false,
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        recipient_id: 'current_user',
        sender: {
            username: 'gurme_seyyah',
            avatar_url: 'https://picsum.photos/50/50?random=1',
        },
    },
    {
        id: '2',
        type: 'comment',
        body: 'senin gönderine yorum yaptı: "Çok leziz olmuş!"',
        is_read: false,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        recipient_id: 'current_user',
        sender: {
            username: 'chef_ali',
            avatar_url: 'https://picsum.photos/50/50?random=2',
        },
    },
    {
        id: '3',
        type: 'follow',
        body: 'seni takip etmeye başladı',
        is_read: true,
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
        recipient_id: 'current_user',
        sender: {
            username: 'lezzet_dunyas',
            avatar_url: 'https://picsum.photos/50/50?random=3',
        },
    },
    {
        id: '4',
        type: 'save',
        body: 'senin tarifini kaydetti',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        recipient_id: 'current_user',
        sender: {
            username: 'fiyonk_mutfak',
            avatar_url: 'https://picsum.photos/50/50?random=4',
        },
    },
    {
        id: '5',
        type: 'level_up',
        body: 'Seviye 3\'e ulaştın! Yeni içerik türlerinin kilidini açtın 🎉',
        is_read: true,
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        recipient_id: 'current_user',
        sender: undefined,
    },
];

export const NotificationScreen = () => {
    const { theme, typography } = useTheme();
    const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
    const insets = useSafeAreaInsets();
    const headerHeight = 64 + insets.top;

    useEffect(() => {
        // Fetch notifications
        fetchNotifications();
    }, []);

    // Use mock data if no notifications
    const displayNotifications = notifications.length > 0 ? notifications : MOCK_NOTIFICATIONS;

    const renderNotificationItem = ({ item }: { item: AppNotification }) => (
        <TouchableOpacity
            style={[
                styles.item,
                {
                    backgroundColor: item.is_read ? 'transparent' : colors.saffron + '08',
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                },
            ]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.6}
        >
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.saffron + '20' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.saffron }}>
                    {item.sender?.username?.[0]?.toUpperCase() || 'S'}
                </Text>
            </View>

            <View style={styles.itemContent}>
                <Text
                    style={[
                        styles.body,
                        {
                            color: theme.text,
                            fontFamily: typography.body,
                        },
                    ]}
                >
                    <Text style={{ fontFamily: typography.bodyMedium }}>
                        {item.sender?.username || 'Sistem'}
                    </Text>
                    {' '}
                    {item.body}
                </Text>
                <Text style={[styles.time, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: tr,
                    })}
                </Text>
            </View>

            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.saffron }]} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={displayNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: headerHeight + 10 },
                ]}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                bounces={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[{ color: theme.secondaryText, fontFamily: typography.body }]}>
                            Henüz bildirim yok.
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
    listContent: {
        flexGrow: 1,
        paddingHorizontal: 12,
        paddingBottom: 100,
    },
    item: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'flex-start',
        borderBottomWidth: 1,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
        flexShrink: 0,
    },
    itemContent: {
        flex: 1,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
        marginTop: 6,
        flexShrink: 0,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
});

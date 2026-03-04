import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow as _formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { doc, onSnapshot } from 'firebase/firestore';
import { Archive, ArrowLeft, Bell, CheckCircle, Heart, MessageCircle, Star, Trophy, UserCheck, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { followUser, unfollowUser } from '../../api/followService';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { LevelBadge } from '../../components/level/LevelBadge';
import { useAuthStore } from '../../store/authStore';
import { useNavigationStore } from '../../store/navigationStore';
import { AppNotification, useNotificationStore } from '../../store/notificationStore';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';

export const NotificationScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation: any = useNavigation();
    const { user } = useAuthStore();
    const { notifications, setupListener, markAsRead } = useNotificationStore();
    const { setActiveTab } = useNavigationStore();
    const insets = useSafeAreaInsets();

    // Track current user's following list for follow/unfollow toggle
    const [following, setFollowing] = useState<string[]>([]);
    const [followLoading, setFollowLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = setupListener(user.uid);
        return () => unsubscribe();
    }, [user]);

    // Subscribe to current user's following list
    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
            if (snap.exists()) {
                setFollowing(snap.data().following || []);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={12} color={colors.spiceRed} fill={colors.spiceRed} />;
            case 'comment': return <MessageCircle size={12} color={theme.text} />;
            case 'badge_earned': return <Trophy size={12} color={colors.saffron} />;
            case 'follow': return <UserPlus size={12} color="#3b82f6" />;
            case 'system': return <Bell size={12} color={colors.saffron} />;
            case 'archive': return <Archive size={12} color={theme.secondaryText} />;
            case 'success': return <CheckCircle size={12} color="#22c55e" />;
            case 'list': return <Star size={12} color={colors.saffron} fill={colors.saffron} />;
            case 'level_up': return <Star size={12} color="#f59e0b" fill="#f59e0b" />;
            case 'xp_gained': return <Star size={16} color={colors.mintFresh} />;
            default: return <Bell size={16} color={colors.saffron} />;
        }
    };

    const safeFormatTime = (ts: any) => {
        if (!ts) return '';
        try {
            const d = ts.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : new Date(ts));
            if (isNaN(d.getTime())) return '';
            return _formatDistanceToNow(d, { locale: tr, addSuffix: true }).replace('yaklaşık ', '');
        } catch {
            return '';
        }
    };

    // Auto-mark all unread notifications as read when loaded
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;
        notifications.filter(n => !n.is_read && n.id).forEach(n => {
            markAsRead(n.id).catch(() => { });
        });
    }, [notifications]);

    const handleFollowToggle = async (targetUserId: string) => {
        if (!user || followLoading !== null) return;
        setFollowLoading(targetUserId);
        try {
            const isFollowing = following.includes(targetUserId);
            if (isFollowing) {
                await unfollowUser(user.uid, targetUserId);
            } else {
                await followUser(user.uid, targetUserId);
            }
        } catch { /* no-op */ } finally {
            setFollowLoading(null);
        }
    };

    const renderNotificationItem = ({ item }: { item: AppNotification }) => {
        const isSystem = item.type === 'system' || !item.sender;
        const isFollow = item.type === 'follow';
        const senderId = (item as any).sender_id ?? (item as any).sender?.uid ?? null;
        const isAlreadyFollowing = senderId ? following.includes(senderId) : false;
        const thumbnailUrl = (item as any).post_thumbnail_url || (item as any).thumbnail_url;
        const pid = (item as any).postId ?? (item as any).post_id ?? null;

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.025)',
                        borderColor: item.is_read ? 'transparent' : `${colors.saffron}20`,
                        borderWidth: 1,
                    },
                ]}
                onPress={async () => {
                    const notifId = (item as any).id || (item as any).notification_id;
                    await markAsRead(notifId);
                    if (pid) {
                        // For comment notifications, pass openComments and focusCommentId
                        if (item.type === 'comment') {
                            navigation.navigate('Reels', {
                                initialPostId: pid,
                                openComments: true,
                                focusCommentId: (item as any).commentId || null,
                            } as any);
                        } else {
                            navigation.navigate('Reels', { initialPostId: pid } as any);
                        }
                    } else if (item.type === 'badge_earned' && item.badgeId) {
                        setActiveTab('Profile');
                        navigation.navigate('Main', {
                            openBadges: true,
                            highlightBadgeId: item.badgeId
                        } as any);
                    } else if (senderId) {
                        navigation.navigate('PublicProfile', { userId: senderId } as any);
                    }
                }}
                activeOpacity={0.8}
            >
                <View style={styles.contentRow}>
                    <View style={styles.leftSection}>
                        {isSystem && item.type !== 'badge_earned' ? (
                            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(20,133,74,0.15)' : 'rgba(20,133,74,0.08)' }]}>
                                {getIcon(item.type)}
                            </View>
                        ) : (
                            <View style={styles.avatarWrapper}>
                                {item.sender?.avatar_url ? (
                                    <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
                                ) : (
                                    <View style={[styles.avatar, { backgroundColor: colors.glassBorder }]}>
                                        <Text style={[styles.avatarLabel, { color: theme.text }]}> {item.sender?.username?.[0]?.toUpperCase()} </Text>
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                    <Text
                                        style={[styles.username, { color: theme.text, fontFamily: typography.bodyMedium }]}
                                        onPress={() => {
                                            if (item.type === 'badge_earned' && item.badgeId) {
                                                setActiveTab('Profile');
                                                navigation.navigate('Main', {
                                                    openBadges: true,
                                                    highlightBadgeId: item.badgeId
                                                });
                                            } else if (senderId) {
                                                navigation.navigate('PublicProfile', { userId: senderId } as any);
                                            }
                                        }}
                                    >
                                        {`@${item.sender?.username ?? ''}`}
                                    </Text>
                                    {(item.sender?.is_verified || (item.sender?.level || 1) >= 10) && <VerificationBadge size={13} />}
                                    {(item.sender?.level || 1) >= 5 && <LevelBadge level={item.sender?.level || 1} size={16} />}
                                </View>
                            )}
                            <Text style={[styles.bodyText, { color: isSystem ? theme.text : theme.secondaryText, fontFamily: typography.body, fontSize: 13 }]}>
                                {item.body}
                                <Text style={[styles.timeText, { color: theme.secondaryText, fontSize: 11, opacity: 0.6 }]}>
                                    {'  '}{safeFormatTime(item.created_at)}
                                </Text>
                            </Text>
                        </View>
                    </View>

                    {isFollow && senderId && (
                        <TouchableOpacity
                            style={[
                                styles.followBtn,
                                {
                                    backgroundColor: isAlreadyFollowing
                                        ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
                                        : colors.saffron,
                                    borderWidth: isAlreadyFollowing ? 1 : 0,
                                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                                }
                            ]}
                            onPress={() => handleFollowToggle(senderId)}
                            disabled={followLoading === senderId}
                        >
                            {isAlreadyFollowing ? (
                                <UserCheck size={13} color={theme.text} style={{ marginRight: 4 }} />
                            ) : (
                                <UserPlus size={13} color="#fff" style={{ marginRight: 4 }} />
                            )}
                            <Text style={[styles.followBtnText, {
                                fontFamily: typography.bodyMedium,
                                color: isAlreadyFollowing ? theme.text : '#fff',
                            }]}>
                                {isAlreadyFollowing ? 'Takipte' : 'Takip Et'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Right thumbnail for post-related notifications (not follow) */}
                    {!isFollow && thumbnailUrl ? (
                        <Image
                            source={{ uri: thumbnailUrl }}
                            style={styles.notificationThumb}
                        />
                    ) : !isFollow && pid && !thumbnailUrl ? (
                        // Placeholder only for comment notifications without thumbnail
                        item.type === 'comment' ? (
                            <View style={[styles.notificationThumb, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }]}>
                                <MessageCircle size={14} color={theme.secondaryText} />
                            </View>
                        ) : null
                    ) : null}


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
        borderRadius: 16,
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
        borderRadius: 24,
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
        borderRadius: 16,
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },
    followBtnText: {
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    notificationThumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        marginLeft: 12,
    },
});

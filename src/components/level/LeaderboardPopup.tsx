import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { doc, getDoc } from 'firebase/firestore';
import { Share2, Trophy, User, UserPlus } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { db } from '../../api/firebase';
import { getLeaderboard, getUserRank } from '../../api/leaderboardService';
import { UserProfile } from '../../api/searchService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { VerificationBadge } from '../common/VerificationBadge';
import { GlassCard } from '../glass/GlassCard';
import { LevelBadge } from './LevelBadge';

const { width } = Dimensions.get('window');

interface LeaderboardPopupProps {
    visible: boolean;
    onClose: () => void;
}

export const LeaderboardPopup: React.FC<LeaderboardPopupProps> = ({ visible, onClose }) => {
    const { theme, isDark, typography } = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [currentUserRank, setCurrentUserRank] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['85%'], []);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboard(50);
            setUsers(data);

            if (user) {
                const profileRef = doc(db, 'profiles', user.uid);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    const profileData = { id: profileSnap.id, ...profileSnap.data() } as UserProfile;
                    setCurrentUserProfile(profileData);

                    const index = data.findIndex(u => u.id === user.uid);
                    if (index !== -1) {
                        setCurrentUserRank(index + 1);
                    } else if (profileData.xp !== undefined) {
                        const rank = await getUserRank(profileData.xp);
                        setCurrentUserRank(rank);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchRanking();
        }
    }, [visible, user?.uid]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
            />
        ),
        [onClose]
    );

    const renderBackground = useCallback(() => (
        <View style={StyleSheet.absoluteFill}>
            <BlurView
                intensity={isDark ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                        borderRadius: 30,
                        overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                ]}
            />
        </View>
    ), [isDark]);

    const TopThree = useMemo(() => {
        if (users.length < 3) return null;

        const top3Order = [users[1], users[0], users[2]];

        return (
            <View style={styles.topThreeContainer}>
                {top3Order.map((item, i) => {
                    const isFirst = i === 1;
                    const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                    const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';

                    return (
                        <View key={item.id} style={[styles.topThreeItem, isFirst && styles.topThreeItemFirst]}>
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: item.avatar_url }}
                                    style={[
                                        styles.topThreeAvatar,
                                        isFirst && styles.topThreeAvatarFirst,
                                        { borderColor: rankColor }
                                    ]}
                                />
                                <View style={[styles.topThreeRankBadge, { backgroundColor: rankColor }]}>
                                    <Text style={styles.topThreeRankText}>{rank}</Text>
                                </View>
                            </View>
                            <Text style={[styles.topThreeName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                                {item.display_name}
                            </Text>
                            <Text style={[styles.topThreeXP, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                                {item.xp?.toLocaleString()} XP
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    }, [users, theme, typography]);

    const handleShare = async (profile: UserProfile) => {
        try {
            await Share.share({
                message: `${profile.display_name} (@${profile.username}) kullanıcısını NeYesem'de takip et!`,
                url: `https://neyesem.app/u/${profile.username}`,
            });
        } catch (error) {
            console.error('Error sharing profile:', error);
        }
    };

    const renderItem = ({ item, index }: { item: UserProfile; index: number }) => {
        if (index < 3) return null;

        const isMe = user?.uid === item.id;

        return (
            <View style={styles.itemWrapper}>
                <GlassCard style={[styles.itemCard, isMe && styles.meCard]} intensity={isMe ? 30 : 5}>
                    <View style={styles.rankContainer}>
                        <Text style={[styles.rankText, { color: theme.secondaryText, fontFamily: typography.mono }]}>#{index + 1}</Text>
                    </View>

                    <View style={styles.userInfo}>
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                        <View style={styles.nameContainer}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                                    {item.display_name}
                                </Text>
                                {item.is_verified && <VerificationBadge size={14} />}
                            </View>
                            <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>@{item.username}</Text>
                        </View>
                    </View>

                    <View style={styles.itemRightActions}>
                        <View style={styles.levelBadgeWrapper}>
                            <LevelBadge level={item.level || 1} size={20} />
                        </View>

                        {!isMe && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.miniActionBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                                    onPress={() => {
                                        onClose();
                                        navigation.navigate('PublicProfile', { userId: item.id });
                                    }}
                                >
                                    <User size={16} color={theme.text} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.miniActionBtn, { backgroundColor: 'rgba(255, 191, 0, 0.15)' }]}
                                    onPress={() => { /* Follow logic */ }}
                                >
                                    <UserPlus size={16} color={colors.saffron} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.miniActionBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                                    onPress={() => handleShare(item)}
                                >
                                    <Share2 size={16} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {isMe && (
                            <View style={[styles.meBadge, { backgroundColor: colors.saffron }]}>
                                <Text style={styles.meBadgeText}>SİZ</Text>
                            </View>
                        )}
                    </View>
                </GlassCard>
            </View>
        );
    };

    const StickyFooter = () => {
        if (!currentUserProfile || currentUserRank <= 50) return null;

        return (
            <View style={styles.footerContainer}>
                <GlassCard style={styles.footerCard} intensity={40}>
                    <View style={styles.rankContainer}>
                        <Text style={[styles.rankText, { color: colors.saffron, fontFamily: typography.mono, fontWeight: 'bold' }]}>#{currentUserRank}</Text>
                    </View>

                    <View style={styles.userInfo}>
                        <Image source={{ uri: currentUserProfile.avatar_url }} style={styles.avatar} />
                        <View style={styles.nameContainer}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                                    {currentUserProfile.display_name} (Siz)
                                </Text>
                                {currentUserProfile.is_verified && <VerificationBadge size={14} />}
                            </View>
                            <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>@{currentUserProfile.username}</Text>
                        </View>
                    </View>

                    <View style={styles.itemRightActions}>
                        <View style={styles.levelBadgeWrapper}>
                            <LevelBadge level={currentUserProfile.level || 1} size={20} />
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.miniActionBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                                onPress={() => handleShare(currentUserProfile)}
                            >
                                <Share2 size={16} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </GlassCard>
            </View>
        );
    };

    if (!visible) return null;

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundComponent={renderBackground}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{ backgroundColor: 'transparent' }}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', width: 40 }}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Trophy size={28} color={colors.saffron} style={{ marginBottom: 8 }} />
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            LİDERLİK TABLOSU
                        </Text>
                    </View>

                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator color={colors.saffron} />
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <BottomSheetFlatList
                                data={users}
                                keyExtractor={(item: UserProfile) => item.id}
                                ListHeaderComponent={() => (
                                    <View style={{ paddingHorizontal: 16 }}>
                                        {TopThree}
                                    </View>
                                )}
                                renderItem={renderItem}
                                contentContainerStyle={styles.list}
                                showsVerticalScrollIndicator={false}
                            />
                            <StickyFooter />
                        </View>
                    )}
                </View>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    title: {
        fontSize: 22,
        letterSpacing: 2,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingBottom: 120,
    },
    topThreeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingVertical: 20,
    },
    topThreeItem: {
        alignItems: 'center',
        width: width * 0.28,
    },
    topThreeItemFirst: {
        width: width * 0.34,
        marginBottom: 15,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    topThreeAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        backgroundColor: 'rgba(128,128,128,0.1)',
    },
    topThreeAvatarFirst: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
    },
    topThreeRankBadge: {
        position: 'absolute',
        bottom: -5,
        alignSelf: 'center',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    topThreeRankText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    topThreeName: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 2,
    },
    topThreeXP: {
        fontSize: 11,
        opacity: 0.8,
    },
    itemWrapper: {
        width: width,
        marginBottom: 8,
    },
    itemCard: {
        width: width,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 20,
        borderRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    meCard: {
        borderColor: colors.saffron,
        borderLeftWidth: 4,
        backgroundColor: 'rgba(255, 191, 0, 0.05)',
    },
    rankContainer: {
        width: 45,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(128,128,128,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    nameContainer: {
        marginLeft: 14,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    displayName: {
        fontSize: 15,
    },
    username: {
        fontSize: 12,
        opacity: 0.7,
    },
    itemRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    levelBadgeWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    miniActionBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    meBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    meBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    levelContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    xpText: {
        fontSize: 10,
        opacity: 0.8,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        zIndex: 10,
    },
    footerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: colors.saffron,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});

import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { doc, getDoc } from 'firebase/firestore';
import { User, UserPlus, XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { db } from '../../api/firebase';
import { followUser, unfollowUser } from '../../api/followService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { VerificationBadge } from '../common/VerificationBadge';
import { LevelBadge } from '../level/LevelBadge';

interface FollowListPopupProps {
    userIds: string[];
    title: string;
    onClose: () => void;
}

interface UserItem {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    level?: number;
    is_verified?: boolean;
}

export const FollowListPopup: React.FC<FollowListPopupProps> = ({ userIds, title, onClose }) => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const bottomSheetRef = useRef<BottomSheet>(null);
    // Ensure popup has at least half screen height by default
    const snapPoints = useMemo(() => ['50%', '90%'], []);

    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentAuthUser } = useAuthStore();
    const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
    const currentUser = currentAuthUser;

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const results: UserItem[] = [];
            for (const uid of userIds) {
                try {
                    const docSnap = await getDoc(doc(db, 'profiles', uid));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        results.push({
                            id: uid,
                            username: data.username || '',
                            display_name: data.display_name || '',
                            avatar_url: data.avatar_url,
                            level: data.level || 1,
                            is_verified: data.is_verified || false,
                        });
                    }
                } catch { }
            }
            setUsers(results);
            setLoading(false);
        };
        if (userIds.length > 0) fetchUsers();
        else setLoading(false);
    }, [userIds]);

    // Load current user's following for action buttons
    useEffect(() => {
        const fetchMe = async () => {
            if (!currentUser?.uid) return;
            try {
                const meSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
                if (meSnap.exists()) {
                    const data: any = meSnap.data();
                    setCurrentUserFollowing(data.following || []);
                }
            } catch {
                // ignore
            }
        };
        fetchMe();
    }, [currentUser?.uid]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
                opacity={0.5}
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

    const handleUserPress = (userId: string) => {
        onClose();
        setTimeout(() => {
            navigation.navigate('PublicProfile', { userId });
        }, 300);
    };

    const renderItem = ({ item }: { item: UserItem }) => {
        const isFollowing = currentUserFollowing.includes(item.id);
        const onPressRow = () => handleUserPress(item.id);
        const onToggleFollow = async () => {
            if (!currentUser?.uid) return;
            try {
                if (isFollowing) {
                    await unfollowUser(currentUser.uid, item.id);
                    setCurrentUserFollowing((arr) => arr.filter((id) => id !== item.id));
                } else {
                    await followUser(currentUser.uid, item.id);
                    setCurrentUserFollowing((arr) => [...arr, item.id]);
                }
            } catch {
                // ignore
            }
        };
        return (
            <View style={styles.userRow}>
                <TouchableOpacity style={styles.userInfoArea} onPress={onPressRow} activeOpacity={0.7}>
                    <View style={[styles.avatar, { backgroundColor: `${colors.saffron}20` }]}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <User size={18} color={colors.saffron} />
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                                {item.display_name || item.username}
                            </Text>
                            {(item.is_verified || (item.level || 1) >= 10) && <VerificationBadge size={13} />}
                            {(item.level || 1) >= 5 && <LevelBadge level={item.level || 1} size={15} />}
                        </View>
                        <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>@
                            {item.username}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={isFollowing ? styles.rightBtnUnfollow : styles.rightBtn} onPress={onToggleFollow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isFollowing ? <XCircle size={14} color="#fff" /> : <UserPlus size={14} color="#fff" />}
                        <Text style={isFollowing ? styles.rightBtnUnfollowText : styles.rightBtnText}>{' '}{isFollowing ? 'Takipten Çık' : 'Takip Et'}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundComponent={renderBackground}
                onClose={onClose}
                backgroundStyle={{
                    backgroundColor: 'transparent',
                }}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: 40 }}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {title} ({userIds.length})
                        </Text>
                    </View>

                    {loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.secondaryText }}>Yükleniyor...</Text>
                        </View>
                    ) : (
                        <BottomSheetFlatList
                            data={users}
                            keyExtractor={(item: UserItem) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={{ color: theme.secondaryText, fontFamily: typography.body }}>
                                        Henüz kimse yok.
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 40,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userInfo: {
        flex: 1,
    },
    displayName: {
        fontSize: 15,
        marginBottom: 2,
    },
    username: {
        fontSize: 13,
        opacity: 0.6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    // Action button on the right for each user item
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    userInfoArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rightBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    rightBtnUnfollow: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: colors.spiceRed,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    rightBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    rightBtnUnfollowText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
});

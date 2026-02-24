import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { db } from '../../api/firebase';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

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
}

export const FollowListPopup: React.FC<FollowListPopupProps> = ({ userIds, title, onClose }) => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['60%', '90%'], []);

    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleUserPress = (userId: string) => {
        onClose();
        setTimeout(() => {
            navigation.navigate('PublicProfile', { userId });
        }, 300);
    };

    const renderItem = ({ item }: { item: UserItem }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleUserPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.avatar, { backgroundColor: `${colors.saffron}20` }]}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                ) : (
                    <User size={18} color={colors.saffron} />
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    {item.display_name || item.username}
                </Text>
                <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    @{item.username}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
                handleIndicatorStyle={{ backgroundColor: theme.border }}
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarImage: {
        width: 46,
        height: 46,
        borderRadius: 23,
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
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
});

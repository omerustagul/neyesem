import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Camera, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { AnimatedLevelCard } from '../../components/level/AnimatedLevelCard';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const ProfileScreen = () => {
    const { theme, typography } = useTheme();
    const { user } = useAuthStore();
    const { level, xp, xpNextLevel, levelName, updateStats } = useLevelStore();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const headerHeight = 64 + insets.top;

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = onSnapshot(
            doc(db, 'profiles', user.uid),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile(data);
                    updateStats({
                        level: data.level || 1,
                        xp: data.xp || 0,
                        xp_next_level: data.xp_next_level || 100,
                    });
                }
                setLoading(false);
            },
            () => {
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user, updateStats]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && user) {
            try {
                await updateDoc(doc(db, 'profiles', user.uid), {
                    avatar_url: result.assets[0].uri,
                });
            } catch {
                Alert.alert('Hata', 'Fotoğraf güncellenemedi.');
            }
        }
    };

    const posts = profile?.post_count || 0;
    const followers = profile?.followers_count || 0;
    const following = profile?.following_count || 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 26 }]}
                scrollIndicatorInsets={{ right: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.8}>
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarFallback, { borderColor: theme.border }]}>
                            <UserIcon color={colors.oliveMuted} size={54} />
                        </View>
                    )}
                    <View style={styles.cameraBadge}>
                        <Camera color={colors.warmWhite} size={14} />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.display }]}>
                    {loading ? '...' : (profile?.display_name || 'Kullanıcı')}
                </Text>
                <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {loading ? '...' : `@${profile?.username || 'kullanici'}`}
                </Text>

                <View style={[styles.statsRow, { borderColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{posts}</Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText }]}>GÖNDERİ</Text>
                    </View>
                    <View style={[styles.statSeparator, { backgroundColor: theme.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{followers}</Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText }]}>TAKİPÇİ</Text>
                    </View>
                    <View style={[styles.statSeparator, { backgroundColor: theme.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{following}</Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText }]}>TAKİP</Text>
                    </View>
                </View>

                <AnimatedLevelCard
                    level={level}
                    xp={xp}
                    xpNext={xpNextLevel}
                    levelName={levelName}
                />

                <Text style={[styles.bio, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {profile?.bio || 'Daha fazla tarif paylaş, seviye atla.'}
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingBottom: 120,
    },
    avatarContainer: {
        width: 142,
        height: 142,
        borderRadius: 71,
        marginBottom: 18,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 71,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        borderRadius: 71,
        borderWidth: 1,
        backgroundColor: '#EBEEEA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 44,
        textAlign: 'center',
        marginBottom: 4,
    },
    username: {
        fontSize: 24,
        marginBottom: 22,
    },
    statsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 18,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 34,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    statSeparator: {
        width: 1,
        height: 42,
    },
    bio: {
        width: '100%',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 14,
    },
});

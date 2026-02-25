import { Image as ExpoImage } from 'expo-image';
import { doc, onSnapshot } from 'firebase/firestore';
import { User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { db } from '../../api/firebase';
import { colors } from '../../theme/colors';

interface UserAvatarProps {
    userId: string;
    size?: number;
    style?: ViewStyle;
    borderWidth?: number;
    borderColor?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    userId,
    size = 40,
    style,
    borderWidth = 0,
    borderColor = 'transparent'
}) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const unsub = onSnapshot(doc(db, 'profiles', userId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setAvatarUrl(data.avatar_url || data.avatarUrl || data.photoURL || null);
            }
        });

        return () => unsub();
    }, [userId]);

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth,
                borderColor
            },
            style
        ]}>
            {avatarUrl ? (
                <ExpoImage
                    source={{ uri: avatarUrl }}
                    style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
                />
            ) : (
                <View style={[styles.fallback, { borderRadius: size / 2 }]}>
                    <User size={size * 0.5} color={colors.oliveMuted} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallback: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

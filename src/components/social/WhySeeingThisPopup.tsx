import { ArrowLeft, Calendar, Heart, Info } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface WhySeeingThisPopupProps {
    username: string;
    isFollowing: boolean;
    onBack?: () => void;
}

export const WhySeeingThisPopup: React.FC<WhySeeingThisPopupProps> = ({
    username,
    isFollowing,
    onBack
}) => {
    const { theme, typography, isDark } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                    Neden görüyorsun?
                </Text>
            </View>

            <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                Gönderiler akışta Neyesem'deki hareketlerin dahil birçok şeye dayanarak gösterilir.
            </Text>

            <View style={styles.reasonsList}>
                {isFollowing && (
                    <View style={styles.reasonItem}>
                        <View style={[styles.iconContainer, { backgroundColor: '#1A6B3A' }]}>
                            <Info size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.reasonText, { color: theme.text, fontFamily: typography.body }]}>
                            {username}'i takip ediyorsun
                        </Text>
                    </View>
                )}

                <View style={styles.reasonItem}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Calendar size={20} color={theme.text} />
                    </View>
                    <Text style={[styles.reasonText, { color: theme.text, fontFamily: typography.body }]}>
                        {username}'i bir süredir takip ediyorsun
                    </Text>
                </View>

                <View style={styles.reasonItem}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Heart size={20} color={theme.text} />
                    </View>
                    <Text style={[styles.reasonText, { color: theme.text, fontFamily: typography.body }]}>
                        Takip ettiğin diğer hesaplardan daha çok {username} hesabının gönderilerini beğeniyorsun
                    </Text>
                </View>

                <View style={styles.reasonItem}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Heart size={20} color={theme.text} />
                    </View>
                    <Text style={[styles.reasonText, { color: theme.text, fontFamily: typography.body }]}>
                        Bu gönderi, akışındaki diğer gönderilerden daha fazla beğenme aldı
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    reasonsList: {
        gap: 20,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

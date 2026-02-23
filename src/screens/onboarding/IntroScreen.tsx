import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Hoş Geldin!',
        description: 'Neyesem ile lezzet dünyasını keşfetmeye hazır mısın?',
    },
    {
        id: '2',
        title: 'Paylaş',
        description: 'Kendi tariflerini ve favori mekanlarını toplulukla paylaş.',
    },
    {
        id: '3',
        title: 'Kazan',
        description: 'Profil fotoğrafını yükle ve anında 50 XP kazan! Seviye atlayarak yeni özelliklerin kilidini aç.',
    },
];

export const IntroScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const { user } = useAuthStore();

    const handleFinish = async () => {
        if (user) {
            try {
                await setDoc(doc(db, 'profiles', user.uid), {
                    intro_seen: true,
                }, { merge: true });
                console.log('Intro basarıyla tamamlandı');
                // RootNavigator otomatik olarak intro_seen degisikligi ile navigate eder
            } catch (error: any) {
                console.error('Intro kaydı hatası:', error);
                console.log('Hata olsa bile uygulamaya geçiliyor...');
            }
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={[styles.slide, { width }]}>
            <View style={{ width: width * 0.8, height: width * 0.8, backgroundColor: colors.glassLight, borderRadius: 20, marginBottom: 40, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 40 }}>???</Text>
            </View>

            <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                {item.title}
            </Text>
            <Text style={[styles.description, { color: theme.secondaryText, fontFamily: typography.body }]}>
                {item.description}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentIndex ? colors.saffron : colors.glassBorder,
                                    width: index === currentIndex ? 24 : 8,
                                }
                            ]}
                        />
                    ))}
                </View>

                <GlassButton
                    title={currentIndex === SLIDES.length - 1 ? "Başla" : "İlerle"}
                    onPress={() => {
                        if (currentIndex === SLIDES.length - 1) {
                            handleFinish();
                        } else {
                            handleFinish();
                        }
                    }}
                    style={{ width: '100%' }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 20,
        gap: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        borderRadius: 4,
        height: 8,
    },
});

import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Globe, Lock } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { db } from '../../api/firebase';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassButton } from '../glass/GlassButton';

const { height } = Dimensions.get('window');

interface CreateListPopupProps {
    visible: boolean;
    onClose: () => void;
}

export const CreateListPopup: React.FC<CreateListPopupProps> = ({ visible, onClose }) => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [loading, setLoading] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => [440], []);

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

    const handleCreate = async () => {
        if (!title.trim() || !user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'lists'), {
                userId: user.uid,
                title: title.trim(),
                locked: isPrivate,
                posts_count: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setTitle('');
            onClose();
        } catch (error) {
            console.error('Error creating list:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                onClose={onClose}
                backgroundStyle={{ backgroundColor: 'transparent' }}
                backgroundComponent={renderBackground}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: 40 }}
            >
                <BottomSheetView style={styles.content}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            YENİ LİSTE OLUŞTUR
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>LİSTE ADI</Text>
                        <BottomSheetTextInput
                            style={[styles.input, {
                                color: theme.text,
                                borderColor: theme.border,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                fontFamily: typography.body
                            }]}
                            placeholder="Örn: Akşam Yemeği Tarifleri"
                            placeholderTextColor={theme.secondaryText}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>GİZLİLİK</Text>
                        <View style={styles.privacyRow}>
                            <TouchableOpacity
                                style={[styles.privacyBtn, !isPrivate && { borderColor: colors.saffron, backgroundColor: `${colors.saffron}18` }]}
                                onPress={() => setIsPrivate(false)}
                            >
                                <Globe size={18} color={!isPrivate ? colors.saffron : theme.secondaryText} />
                                <Text style={[styles.privacyText, { color: !isPrivate ? colors.saffron : theme.text, fontFamily: typography.bodyMedium }]}>Herkese Açık</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.privacyBtn, isPrivate && { borderColor: colors.saffron, backgroundColor: `${colors.saffron}18` }]}
                                onPress={() => setIsPrivate(true)}
                            >
                                <Lock size={18} color={isPrivate ? colors.saffron : theme.secondaryText} />
                                <Text style={[styles.privacyText, { color: isPrivate ? colors.saffron : theme.text, fontFamily: typography.bodyMedium }]}>Gizli</Text>
                            </TouchableOpacity>
                        </View>

                        <GlassButton
                            title="Oluştur"
                            onPress={handleCreate}
                            loading={loading}
                            disabled={!title.trim()}
                            style={{ marginTop: 32 }}
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 8,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 12,
        textAlign: 'center',
        letterSpacing: 1.5,
        opacity: 0.7,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 20,
        fontSize: 16,
    },
    privacyRow: {
        flexDirection: 'row',
        gap: 12,
    },
    privacyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    privacyText: {
        fontSize: 15,
    },
});

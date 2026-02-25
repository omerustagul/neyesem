import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Globe, Lock, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../api/firebase';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';

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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.container}>
                    <GlassCard style={[styles.card, { borderColor: theme.border }]}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>Yeni Liste Oluştur</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>LİSTE ADI</Text>
                            <TextInput
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
                                    style={[styles.privacyBtn, !isPrivate && { borderColor: colors.saffron, backgroundColor: `${colors.saffron}15` }]}
                                    onPress={() => setIsPrivate(false)}
                                >
                                    <Globe size={18} color={!isPrivate ? colors.saffron : theme.secondaryText} />
                                    <Text style={[styles.privacyText, { color: !isPrivate ? colors.saffron : theme.secondaryText, fontFamily: typography.bodyMedium }]}>Herkese Açık</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.privacyBtn, isPrivate && { borderColor: colors.saffron, backgroundColor: `${colors.saffron}15` }]}
                                    onPress={() => setIsPrivate(true)}
                                >
                                    <Lock size={18} color={isPrivate ? colors.saffron : theme.secondaryText} />
                                    <Text style={[styles.privacyText, { color: isPrivate ? colors.saffron : theme.secondaryText, fontFamily: typography.bodyMedium }]}>Gizli</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.createBtn, { opacity: title.trim() ? 1 : 0.6 }]}
                                onPress={handleCreate}
                                disabled={!title.trim() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.warmWhite} />
                                ) : (
                                    <Text style={styles.createBtnText}>Oluştur</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        padding: 0,
        overflow: 'hidden',
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 18,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
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
        gap: 8,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    privacyText: {
        fontSize: 14,
    },
    createBtn: {
        height: 50,
        backgroundColor: colors.saffron,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createBtnText: {
        color: colors.warmWhite,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

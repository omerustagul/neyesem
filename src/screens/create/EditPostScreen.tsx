import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChefHat, Clock, Flame, Info, Utensils } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post, updatePost } from '../../api/postService';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { GlassCard } from '../../components/glass/GlassCard';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const EditPostScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const post = route.params?.post as Post;
    const insets = useSafeAreaInsets();

    const [caption, setCaption] = useState(post?.caption || '');
    const [cookingTime, setCookingTime] = useState(post?.cooking_time || '');
    const [difficulty, setDifficulty] = useState(post?.difficulty || '');
    const [calories, setCalories] = useState(post?.calories?.toString() || '');
    const [protein, setProtein] = useState(post?.protein || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!caption.trim()) {
            Alert.alert('Hata', 'Açıklama boş olamaz.');
            return;
        }

        setIsSaving(true);
        try {
            await updatePost(post.id, {
                caption,
                cooking_time: cookingTime,
                difficulty,
                calories: calories ? parseInt(calories) : undefined,
                protein,
            });
            Alert.alert('Başarılı', 'Gönderi güncellendi.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!post) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    Gönderiyi Düzenle
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={[styles.saveButton, { backgroundColor: colors.saffron }]}
                >
                    {isSaving ? (
                        <Text style={{ color: '#fff' }}>...</Text>
                    ) : (
                        <Check color="#fff" size={20} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Preview */}
                <View style={styles.previewContainer}>
                    {post.content_type === 'video' && post.content_url ? (
                        <VideoThumbnail
                            videoUri={post.content_url}
                            thumbnailUri={post.thumbnail_url}
                            style={styles.previewImage}
                            showPlayIcon={false}
                        />
                    ) : post.content_url ? (
                        <Image source={{ uri: post.content_url }} style={styles.previewImage} />
                    ) : null}
                    <View style={styles.previewOverlay}>
                        <Info size={16} color="#fff" />
                        <Text style={styles.previewText}>Video değiştirilemez</Text>
                    </View>
                </View>

                {/* Caption Section */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        Açıklama
                    </Text>
                    <TextInput
                        style={[styles.captionInput, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            color: theme.text,
                            fontFamily: typography.body
                        }]}
                        placeholder="Harika bir tarif açıklaması yaz..."
                        placeholderTextColor={theme.secondaryText}
                        multiline
                        maxLength={500}
                        value={caption}
                        onChangeText={setCaption}
                    />
                </View>

                {/* Recipe Details Section */}
                <GlassCard style={styles.detailsCard}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Yemek Detayları
                    </Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.inputIcon}>
                            <Clock size={18} color={colors.saffron} />
                        </View>
                        <TextInput
                            style={[styles.detailInput, { color: theme.text, fontFamily: typography.body }]}
                            placeholder="Pişirme Süresi (örn: 30 dk)"
                            placeholderTextColor={theme.secondaryText}
                            value={cookingTime}
                            onChangeText={setCookingTime}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.inputIcon}>
                            <ChefHat size={18} color={colors.saffron} />
                        </View>
                        <TextInput
                            style={[styles.detailInput, { color: theme.text, fontFamily: typography.body }]}
                            placeholder="Zorluk (örn: Kolay, Orta)"
                            placeholderTextColor={theme.secondaryText}
                            value={difficulty}
                            onChangeText={setDifficulty}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <View style={styles.inputIcon}>
                                <Flame size={18} color={colors.saffron} />
                            </View>
                            <TextInput
                                style={[styles.detailInput, { color: theme.text, fontFamily: typography.body }]}
                                placeholder="Kalori"
                                placeholderTextColor={theme.secondaryText}
                                keyboardType="numeric"
                                value={calories}
                                onChangeText={setCalories}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                            <View style={styles.inputIcon}>
                                <Utensils size={18} color={colors.saffron} />
                            </View>
                            <TextInput
                                style={[styles.detailInput, { color: theme.text, fontFamily: typography.body }]}
                                placeholder="Protein"
                                placeholderTextColor={theme.secondaryText}
                                value={protein}
                                onChangeText={setProtein}
                            />
                        </View>
                    </View>
                </GlassCard>
            </ScrollView>
        </KeyboardAvoidingView>
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
        height: Platform.OS === 'ios' ? 100 : 70,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    previewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    previewText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        marginBottom: 10,
    },
    captionInput: {
        minHeight: 120,
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        textAlignVertical: 'top',
    },
    detailsCard: {
        padding: 20,
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.2)',
        marginBottom: 16,
        paddingBottom: 4,
    },
    inputIcon: {
        width: 32,
        alignItems: 'center',
    },
    detailInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 8,
    },
    inputRow: {
        flexDirection: 'row',
    }
});

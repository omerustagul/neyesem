import { Image, Link, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createPost } from '../../api/postService';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const CreateScreen = ({ navigation }: any) => {
    const { theme, typography } = useTheme();
    const { level } = useLevelStore();
    const { user, profile } = useAuthStore();

    const [showPostForm, setShowPostForm] = useState(false);
    const [postCaption, setPostCaption] = useState('');
    const [postUrl, setPostUrl] = useState('');
    const [contentType, setContentType] = useState<'text' | 'embed'>('text');
    const [isCreating, setIsCreating] = useState(false);

    const options = [
        {
            id: 'post',
            title: 'Gönderi Oluştur',
            icon: <Image color={level >= 2 ? colors.saffron : colors.oliveLight} />,
            minLevel: 2,
            desc: 'Fotoğraf veya video paylaş'
        },
        {
            id: 'story',
            title: 'Story Oluştur',
            icon: <Video color={level >= 3 ? colors.saffron : colors.oliveLight} />,
            minLevel: 3,
            desc: '24 saatlik anılar'
        },
        {
            id: 'embed',
            title: 'Embed Paylaş',
            icon: <Link color={level >= 4 ? colors.saffron : colors.oliveLight} />,
            minLevel: 4,
            desc: 'Instagram/TikTok videosu'
        },
    ];

    const handleOptionPress = (option: any) => {
        if (level < option.minLevel) {
            Alert.alert('Hata', 'Bu özellik için Level ' + option.minLevel + ' gerekli!');
        } else {
            if (option.id === 'post' || option.id === 'embed') {
                setContentType(option.id === 'embed' ? 'embed' : 'text');
                setShowPostForm(true);
            } else {
                Alert.alert('Bilgi', 'Story özelliği yakında aktif olacak.');
            }
        }
    };

    const handleCreatePost = async () => {
        if (!postCaption.trim()) {
            Alert.alert('Hata', 'Lütfen bir şeyler yazın.');
            return;
        }

        if (contentType === 'embed' && !postUrl.trim()) {
            Alert.alert('Hata', 'Lütfen bir URL girin.');
            return;
        }

        if (!user || !profile) {
            Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
            return;
        }

        setIsCreating(true);
        try {
            const username = profile.username || user.email?.split('@')[0] || 'user';
            const displayName = profile.display_name || user.displayName || 'Kullanıcı';
            const avatarUrl = profile.avatar_url || '';

            await createPost(
                user.uid,
                username,
                displayName,
                avatarUrl,
                postCaption,
                contentType,
                postUrl.trim() || undefined
            );

            Alert.alert('Başarılı', 'Gönderiniz yayınlandı!');
            setPostCaption('');
            setPostUrl('');
            setShowPostForm(false);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Hata', 'Gönderi oluşturulurken hata oluştu: ' + error.message);
            console.error('Create post error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (showPostForm) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowPostForm(false)}
                >
                    <Text style={{ color: theme.text, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>

                <View style={styles.formContainer}>
                    <Text style={[styles.formTitle, { color: theme.text, fontFamily: typography.display }]}>
                        {contentType === 'embed' ? 'Embed Paylaş' : 'Gönderi Oluştur'}
                    </Text>

                    <GlassCard style={styles.form}>
                        <Text style={[styles.label, { color: theme.secondaryText }]}>
                            İçeriğiniz
                        </Text>
                        <TextInput
                            style={[
                                styles.captionInput,
                                {
                                    color: theme.text,
                                    borderColor: colors.glassBorder,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                }
                            ]}
                            placeholder="Neler düşünüyorsunuz?"
                            placeholderTextColor={theme.secondaryText}
                            value={postCaption}
                            onChangeText={setPostCaption}
                            multiline
                            numberOfLines={6}
                        />

                        {contentType === 'embed' && (
                            <>
                                <Text style={[styles.label, { color: theme.secondaryText }]}>
                                    Video URL (Instagram/TikTok)
                                </Text>
                                <GlassInput
                                    placeholder="https://..."
                                    value={postUrl}
                                    onChangeText={setPostUrl}
                                />
                            </>
                        )}

                        <GlassButton
                            title={isCreating ? 'Yayınlanıyor...' : 'Yayınla'}
                            onPress={handleCreatePost}
                            style={styles.publishButton}
                        />
                    </GlassCard>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => navigation.goBack()}
            />
            <View style={styles.sheet}>
                <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                    Oluştur
                </Text>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.option,
                            { opacity: level < option.minLevel ? 0.6 : 1 }
                        ]}
                        onPress={() => handleOptionPress(option)}
                    >
                        <GlassCard style={styles.optionCard}>
                            <View style={styles.optionInfo}>
                                <View style={styles.iconContainer}>{option.icon}</View>
                                <View>
                                    <Text style={[styles.optionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        {option.title}
                                    </Text>
                                    <Text style={[styles.optionDesc, { color: theme.secondaryText }]}>
                                        {option.desc}
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    formContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    formTitle: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    captionInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        fontFamily: 'System',
    },
    publishButton: {
        marginTop: 20,
    },
    sheet: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    title: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 20,
    },
    option: {
        marginBottom: 12,
    },
    optionCard: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 12,
    },
});

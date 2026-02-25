import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, BookOpen, Camera, Link, Lock, Image as LucideImage, Sparkles, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { createPost, type FoodCategory } from '../../api/postService';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

type CreateStep = 'select' | 'post_media' | 'post_caption' | 'post_details' | 'post_ai' | 'embed_form';

export const CreateScreen = ({ navigation }: any) => {
    const { theme, isDark, typography } = useTheme();
    const { level } = useLevelStore();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<any>(null);
    const [step, setStep] = useState<CreateStep>('select');
    const [postCaption, setPostCaption] = useState('');
    const [postUrl, setPostUrl] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // New Post Meta State
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [cookingTime, setCookingTime] = useState('15dk');
    const [difficulty, setDifficulty] = useState('Orta');
    const [calories, setCalories] = useState(0);
    const [protein, setProtein] = useState('');
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const [foodCategory, setFoodCategory] = useState<FoodCategory | null>(null);
    const [hashtagInput, setHashtagInput] = useState('');
    const [customHashtags, setCustomHashtags] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const snap = await getDoc(doc(db, 'profiles', user.uid));
                if (snap.exists()) setProfile(snap.data());
            } catch (e) {
                console.warn('Failed to fetch profile for create screen', e);
            }
        };
        fetchProfile();
    }, [user]);

    const options = [
        {
            id: 'post',
            title: 'Gönderi Oluştur',
            desc: 'Fotoğraf veya video paylaş',
            icon: BookOpen,
            minLevel: 1,
            gradient: ['#22c55e', '#16a34a'],
        },
        {
            id: 'story',
            title: 'Hikaye Oluştur',
            desc: '24 saatte kaybolan anlar',
            icon: Sparkles,
            minLevel: 1,
            gradient: ['#8b5cf6', '#7c3aed'],
        },
        {
            id: 'embed',
            title: 'Video Embed',
            desc: 'Instagram/TikTok videosu paylaş',
            icon: Link,
            minLevel: 2,
            gradient: ['#f59e0b', '#d97706'],
        },
    ];

    const handleOptionPress = (option: typeof options[0]) => {
        if (level < option.minLevel) {
            Alert.alert('Seviye Yetersiz', `Bu özellik için Level ${option.minLevel} gerekli! Seviye atlamak için daha fazla etkileşimde bulun.`);
            return;
        }
        if (option.id === 'story') {
            navigation.navigate('CreateStory');
        } else if (option.id === 'post') {
            setStep('post_media');
        } else if (option.id === 'embed') {
            setStep('embed_form');
        }
    };

    const handleCreatePost = async () => {
        if (!postCaption.trim()) {
            Alert.alert('Hata', 'Lütfen bir şeyler yazın.');
            return;
        }

        let contentType: 'text' | 'image' | 'video' | 'embed' = 'text';
        if (step === 'embed_form') {
            contentType = 'embed';
        } else if (selectedMedia) {
            // Determine if it's a video or image based on file extension or media type
            const isVideo = selectedMedia.toLowerCase().match(/\.(mp4|mov|m4v)$/) || selectedMedia.startsWith('data:video');
            contentType = isVideo ? 'video' : 'image';
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

            const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dj4jcgbwv';

            let contentUrl: string | undefined = postUrl.trim() || undefined;
            let thumbnailUrl: string | undefined;

            if ((contentType === 'video' || contentType === 'image') && selectedMedia) {
                try {
                    // 1. Upload main media to Cloudinary (Signed)
                    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '954885719674597';
                    const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'IADI9j1XtSo0Du0t7f7F7loC_Y0';
                    const folder = contentType === 'video' ? 'videos' : 'images';
                    const timestamp = Math.floor(Date.now() / 1000);

                    // Create signature
                    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
                    const signature = sha1(paramsToSign + apiSecret);

                    const formData = new FormData();
                    formData.append('file', {
                        uri: selectedMedia,
                        type: contentType === 'video' ? 'video/mp4' : 'image/jpeg',
                        name: `post_${user.uid}_${Date.now()}.${contentType === 'video' ? 'mp4' : 'jpg'}`,
                    } as any);
                    formData.append('api_key', apiKey);
                    formData.append('folder', folder);
                    formData.append('timestamp', String(timestamp));
                    formData.append('signature', signature);

                    const response = await fetch(
                        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                        { method: 'POST', body: formData }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Cloudinary Upload Error:', errorText);
                        throw new Error(`Yükleme hatası (${response.status}): ${errorText}`);
                    }

                    const result = await response.json();
                    contentUrl = result.secure_url;

                    // 2. If video, generate and upload thumbnail
                    if (contentType === 'video') {
                        try {
                            const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(selectedMedia, {
                                time: 1000,
                                quality: 0.7,
                            });

                            const thumbFolder = 'thumbnails';
                            const thumbTimestamp = Math.floor(Date.now() / 1000);
                            const thumbParamsToSign = `folder=${thumbFolder}&timestamp=${thumbTimestamp}`;
                            const thumbSignature = sha1(thumbParamsToSign + apiSecret);

                            const thumbFormData = new FormData();
                            thumbFormData.append('file', {
                                uri: thumbUri,
                                type: 'image/jpeg',
                                name: `thumb_${user.uid}_${Date.now()}.jpg`,
                            } as any);
                            thumbFormData.append('api_key', apiKey);
                            thumbFormData.append('folder', thumbFolder);
                            thumbFormData.append('timestamp', String(thumbTimestamp));
                            thumbFormData.append('signature', thumbSignature);

                            const thumbRes = await fetch(
                                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                                { method: 'POST', body: thumbFormData }
                            );

                            if (thumbRes.ok) {
                                const thumbResult = await thumbRes.json();
                                thumbnailUrl = thumbResult.secure_url;
                            }
                        } catch (thumbError) {
                            console.warn('Thumbnail upload error:', thumbError);
                        }
                    }
                } catch (uploadError: any) {
                    console.error('Medya yüklenemedi:', uploadError);
                    Alert.alert('Hata', `Medya yüklenirken bir sorun oluştu: ${uploadError.message}`);
                    setIsCreating(false);
                    return;
                }
            }

            const tags = extractTags();

            await createPost(
                user.uid,
                username,
                displayName,
                avatarUrl,
                postCaption,
                contentType,
                contentUrl,
                cookingTime,
                difficulty,
                calories,
                protein,
                thumbnailUrl,
                tags,
                [],
                undefined,
                undefined,
                undefined,
                foodCategory || undefined,
                customHashtags
            );

            // Reward XP
            const { addXP } = useLevelStore.getState();
            await addXP(user.uid, 24);

            Alert.alert('Başarılı', 'Gönderiniz yayınlandı!');
            resetForm();
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Hata', 'Gönderi oluşturulurken hata oluştu: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const extractTags = () => {
        const text = postCaption.toLowerCase();
        const tags: string[] = [];
        if (text.includes('türk') || text.includes('kebap') || text.includes('tavuk')) tags.push('turkish');
        if (text.includes('italya') || text.includes('makarna') || text.includes('pizza')) tags.push('italian');
        if (text.includes('asya') || text.includes('suşi') || text.includes('ramen')) tags.push('asian');
        if (text.includes('vegan') || text.includes('sebze') || text.includes('salata')) tags.push('vegan');
        if (text.includes('acı') || text.includes('pul biber')) tags.push('spicy');
        if (text.includes('tatlı') || text.includes('pastane') || text.includes('şeker')) tags.push('sweet');
        if (text.includes('sokak') || text.includes('burger')) tags.push('streetFood');
        if (text.includes('ev yapımı') || text.includes('anne')) tags.push('homeCooking');
        return tags;
    };

    const resetForm = () => {
        setPostCaption('');
        setPostUrl('');
        setSelectedMedia(null);
        setCookingTime('15dk');
        setDifficulty('Orta');
        setCalories(0);
        setProtein('');
        setFoodCategory(null);
        setHashtagInput('');
        setCustomHashtags([]);
        setStep('select');
    };

    const handleAddHashtag = () => {
        const trimmed = hashtagInput.trim();
        if (!trimmed) return;
        
        // Add # if not present
        const hashtag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
        
        if (!customHashtags.includes(hashtag)) {
            setCustomHashtags([...customHashtags, hashtag]);
        }
        setHashtagInput('');
    };

    const handleRemoveHashtag = (hashtag: string) => {
        setCustomHashtags(customHashtags.filter(h => h !== hashtag));
    };

    const runAiAnalysis = () => {
        setIsAiAnalyzing(true);
        setStep('post_ai');

        // Simulate AI analysis delay
        setTimeout(() => {
            // "AI Calculation" logic based on caption
            const text = postCaption.toLowerCase();
            let baseCal = 300 + Math.floor(Math.random() * 200);
            let baseProt = 15 + Math.floor(Math.random() * 10);

            if (text.includes('tavuk') || text.includes('et') || text.includes('balık')) {
                baseProt += 15;
                baseCal += 100;
            }
            if (text.includes('pasta') || text.includes('tatlı') || text.includes('şeker')) {
                baseCal += 300;
                baseProt -= 5;
            }

            setCalories(baseCal);
            setProtein(`${baseProt}g`);
            setIsAiAnalyzing(false);
        }, 3000);
    };

    const handleClose = () => {
        if (step !== 'select') {
            resetForm();
        } else {
            navigation.goBack();
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Video seçebilmek için galeri erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.4,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
            setStep('post_caption');
        }
    };

    const takeVideo = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Video çekebilmek için kamera izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.4,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
            setStep('post_caption');
        }
    };

    const renderProgressBar = () => {
        const steps: CreateStep[] = ['post_media', 'post_caption', 'post_details', 'post_ai'];
        if (step === 'select' || step === 'embed_form') return null;

        const currentIndex = steps.indexOf(step);
        const progress = ((currentIndex + 1) / steps.length) * 100;

        return (
            <View style={styles.progressContainer}>
                <View style={[styles.progressBase, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <MotiView
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', damping: 20 }}
                        style={[styles.progressFill, { backgroundColor: colors.saffron }]}
                    />
                </View>
                <Text style={[styles.progressText, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                    Adım {currentIndex + 1} / {steps.length}
                </Text>
            </View>
        );
    };

    // Unified handle for steps
    const renderStepContent = () => {
        switch (step) {
            case 'post_media':
                return (
                    <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Video Seç</Text>
                        <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Tarifini en iyi anlatan videoyu seçerek başlayalım.</Text>

                        <View style={styles.mediaOptions}>
                            <TouchableOpacity style={[styles.bigMediaBtn, { borderColor: theme.border }]} onPress={takeVideo}>
                                <Camera size={40} color={colors.saffron} />
                                <Text style={[styles.bigMediaLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>Kamera ile Çek</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.bigMediaBtn, { borderColor: theme.border }]} onPress={pickImage}>
                                <LucideImage size={40} color={colors.saffron} />
                                <Text style={[styles.bigMediaLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>Galeriden Seç</Text>
                            </TouchableOpacity>
                        </View>
                    </MotiView>
                );

            case 'post_caption':
                return (
                    <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Neler Pişiyor?</Text>
                        <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Kısaca tarifinden veya o anki duygularından bahset.</Text>

                        <GlassCard>
                            <TextInput
                                style={[styles.captionInput, { color: theme.text, borderColor: theme.border, fontFamily: typography.body }]}
                                placeholder="Harika bir İtalyan makarnası yapıyoruz..."
                                placeholderTextColor={theme.secondaryText}
                                value={postCaption}
                                onChangeText={setPostCaption}
                                multiline
                                numberOfLines={6}
                                autoFocus
                            />
                            <GlassButton
                                title="Devam Et"
                                trailingIcon={<ArrowRight size={20} color={colors.warmWhite} />}
                                onPress={() => setStep('post_details')}
                            />
                        </GlassCard>
                    </MotiView>
                );

            case 'post_details':
                return (
                    <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Tarif Detayları</Text>
                        <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Hazırlama süresi ve zorluk seviyesini belirt.</Text>

                        <GlassCard>
                            <Text style={styles.miniLabel}>HAZIRLAMA SÜRESİ</Text>
                            <View style={styles.chipRow}>
                                {['15dk', '30dk', '45dk', '60dk+'].map(time => (
                                    <TouchableOpacity
                                        key={time}
                                        style={[styles.chip, cookingTime === time && { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                                        onPress={() => setCookingTime(time)}
                                    >
                                        <Text style={[styles.chipText, { color: cookingTime === time ? '#fff' : theme.text }]}>{time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.miniLabel, { marginTop: 24 }]}>ZORLUK SEVİYESİ</Text>
                            <View style={styles.chipRow}>
                                {['Kolay', 'Orta', 'Zor'].map(diff => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[styles.chip, difficulty === diff && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                        onPress={() => setDifficulty(diff)}
                                    >
                                        <Text style={[styles.chipText, { color: difficulty === diff ? '#fff' : theme.text }]}>{diff}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.miniLabel, { marginTop: 24 }]}>YİYECEK KATEGORİSİ</Text>
                            <View style={styles.chipRow}>
                                {(['meal', 'dessert', 'snack', 'beverage', 'breakfast', 'appetizer'] as FoodCategory[]).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, foodCategory === cat && { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                                        onPress={() => setFoodCategory(cat)}
                                    >
                                        <Text style={[styles.chipText, { color: foodCategory === cat ? '#fff' : theme.text }]}>
                                            {cat === 'meal' ? 'Yemek' : cat === 'dessert' ? 'Tatlı' : cat === 'snack' ? 'Atıştırmalık' : cat === 'beverage' ? 'İçecek' : cat === 'breakfast' ? 'Kahvaltı' : 'Meze'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.miniLabel, { marginTop: 24 }]}>HASHTAG'LER</Text>
                            <View style={styles.hashtagContainer}>
                                <View style={[styles.hashtagInput, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                                    <TextInput
                                        style={[styles.hashtagInputField, { color: theme.text, fontFamily: typography.body }]}
                                        placeholder="#tarif #lezzet"
                                        placeholderTextColor={theme.secondaryText}
                                        value={hashtagInput}
                                        onChangeText={setHashtagInput}
                                        onSubmitEditing={handleAddHashtag}
                                        multiline={false}
                                    />
                                    <TouchableOpacity onPress={handleAddHashtag} style={[styles.hashtagAddBtn, { backgroundColor: colors.saffron }]}>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>+</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.hashtagList}>
                                    {customHashtags.map((hashtag, idx) => (
                                        <View key={idx} style={[styles.hashtagTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                            <Text style={[styles.hashtagTagText, { color: theme.text }]}>{hashtag}</Text>
                                            <TouchableOpacity onPress={() => handleRemoveHashtag(hashtag)}>
                                                <Text style={[styles.hashtagRemove, { color: colors.spiceRed }]}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <GlassButton
                                title="AI Analizi Yap"
                                style={{ marginTop: 32 }}
                                icon={<Sparkles size={20} color={colors.warmWhite} />}
                                onPress={runAiAnalysis}
                            />
                        </GlassCard>
                    </MotiView>
                );

            case 'post_ai':
                return (
                    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing' }}>
                        {isAiAnalyzing ? (
                            <View style={styles.aiAnalyzingContainer}>
                                <MotiView
                                    from={{ rotate: '0deg', scale: 1 }}
                                    animate={{ rotate: '360deg', scale: 1.2 }}
                                    transition={{ loop: true, type: 'timing', duration: 2000 }}
                                >
                                    <Sparkles size={80} color={colors.saffron} />
                                </MotiView>
                                <Text style={[styles.aiTitle, { color: theme.text, fontFamily: typography.display }]}>AI Analiz Ediyor...</Text>
                                <Text style={[styles.aiDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Malzemeler ve besin değerleri hesaplanıyor.</Text>
                            </View>
                        ) : (
                            <MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                                <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Analiz Tamamlandı!</Text>
                                <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Yapay zeka tarifini analiz etti.</Text>

                                <View style={styles.aiResultGrid}>
                                    <View style={[styles.aiResultCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                        <View style={styles.aiIconBox}><Text style={{ fontSize: 20 }}>🔥</Text></View>
                                        <View>
                                            <Text style={styles.aiResultLabel}>KALORİ</Text>
                                            <Text style={[styles.aiResultValue, { color: theme.text }]}>~{calories} kcal</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.aiResultCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                        <View style={styles.aiIconBox}><Text style={{ fontSize: 20 }}>⚖️</Text></View>
                                        <View>
                                            <Text style={styles.aiResultLabel}>PROTEİN</Text>
                                            <Text style={[styles.aiResultValue, { color: theme.text }]}>{protein}</Text>
                                        </View>
                                    </View>
                                </View>

                                <GlassButton
                                    title={isCreating ? 'Yayınlanıyor...' : 'Lezzeti Paylaş!'}
                                    loading={isCreating}
                                    style={{ marginTop: 32 }}
                                    onPress={handleCreatePost}
                                />
                                <TouchableOpacity onPress={() => setStep('post_details')} style={styles.backBtnText}>
                                    <Text style={{ color: theme.text }}>Bilgileri Düzenle</Text>
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </MotiView>
                );

            case 'embed_form':
                return (
                    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing' }}>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Video Linki</Text>
                        <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Instagram veya TikTok videosu paylaş.</Text>
                        <GlassCard>
                            <GlassInput
                                placeholder="https://www.instagram.com/reel/..."
                                value={postUrl}
                                onChangeText={setPostUrl}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                            <Text style={[styles.miniLabel, { marginTop: 16 }]}>AÇIKLAMA</Text>
                            <TextInput
                                style={[styles.captionInput, { height: 100, color: theme.text, borderColor: theme.border, fontFamily: typography.body }]}
                                placeholder="Bu video harika!"
                                value={postCaption}
                                onChangeText={setPostCaption}
                                multiline
                            />
                            <GlassButton title="Paylaş" loading={isCreating} onPress={handleCreatePost} />
                        </GlassCard>
                    </MotiView>
                );

            default:
                return null;
        }
    };

    if (step !== 'select') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.formHeader, { paddingTop: insets.top + 40 }]}>
                    <TouchableOpacity
                        style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
                        onPress={handleClose}
                    >
                        <X size={18} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.formHeaderTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Oluştur
                    </Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.formContent}
                    bounces={true}
                    alwaysBounceVertical={Platform.OS === 'ios'}
                    showsVerticalScrollIndicator={false}
                >
                    {renderProgressBar()}
                    {renderStepContent()}
                </ScrollView>
            </View>
        );
    }

    // Main selection view — full screen
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.selectHeader, { paddingTop: insets.top + 40 }]}>
                <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
                    onPress={handleClose}
                >
                    <X size={18} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.selectTitle, { color: theme.text, fontFamily: typography.display }]}>
                    Oluştur
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.optionsContainer}>
                {options.map((option, index) => {
                    const Icon = option.icon;
                    const isLocked = level < option.minLevel;

                    return (
                        <MotiView
                            key={option.id}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 400, delay: index * 100 }}
                        >
                            <TouchableOpacity
                                style={{ opacity: isLocked ? 0.55 : 1, marginBottom: 14 }}
                                onPress={() => handleOptionPress(option)}
                                activeOpacity={0.75}
                            >
                                <GlassCard>
                                    <View style={styles.optionRow}>
                                        <View style={[styles.optionIcon, { backgroundColor: `${option.gradient[0]}18` }]}>
                                            <Icon size={28} color={option.gradient[0]} />
                                        </View>
                                        <View style={styles.optionText}>
                                            <View style={styles.optionTitleRow}>
                                                <Text style={[styles.optionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                    {option.title}
                                                </Text>
                                                {isLocked && (
                                                    <View style={[styles.lockBadge, { backgroundColor: `${colors.spiceRed}20` }]}>
                                                        <Lock size={10} color={colors.spiceRed} />
                                                        <Text style={{ color: colors.spiceRed, fontSize: 10, fontWeight: '700', marginLeft: 3 }}>
                                                            Lv.{option.minLevel}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.optionDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                                {isLocked ? `Level ${option.minLevel} gerekli` : option.desc}
                                            </Text>
                                        </View>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </MotiView>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Selection view
    selectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    selectTitle: {
        fontSize: 20,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 32,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    optionText: {
        flex: 1,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionTitle: {
        fontSize: 16,
        marginBottom: 3,
    },
    optionDesc: {
        fontSize: 13,
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    // Form view
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    formHeaderTitle: {
        fontSize: 18,
    },
    formContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    label: {
        fontSize: 13,
        marginBottom: 8,
    },
    captionInput: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    mediaRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    mediaButton: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mediaLabel: {
        fontSize: 13,
    },
    // New Multi-step styles
    stepTitle: { fontSize: 24, marginBottom: 8, letterSpacing: -0.5 },
    stepDesc: { fontSize: 16, marginBottom: 24, opacity: 0.7 },
    progressContainer: { marginBottom: 32 },
    progressBase: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, textAlign: 'right' },
    mediaOptions: { flex: 1, gap: 16, marginTop: 10 },
    bigMediaBtn: {
        height: 140,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    bigMediaLabel: { fontSize: 16 },
    miniLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: colors.oliveMuted, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    chipText: { fontSize: 14, fontWeight: '600' },
    aiAnalyzingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    aiTitle: { fontSize: 22, marginTop: 32, marginBottom: 8 },
    aiDesc: { fontSize: 16, textAlign: 'center', opacity: 0.6 },
    aiResultGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
    aiResultCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    aiIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
    aiResultLabel: { fontSize: 10, fontWeight: '900', color: colors.oliveMuted, marginBottom: 2 },
    aiResultValue: { fontSize: 15, fontWeight: 'bold' },
    backBtnText: { marginTop: 20, alignSelf: 'center' },
    // Hashtag styles
    hashtagContainer: { marginTop: 12, marginBottom: 20 },
    hashtagInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 12,
    },
    hashtagInputField: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 12,
    },
    hashtagAddBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hashtagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hashtagTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    hashtagTagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    hashtagRemove: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});


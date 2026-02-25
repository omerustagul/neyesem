import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { sha1 } from 'js-sha1';
import {
    Camera,
    Check,
    Download,
    Image as LucideImage,
    Music,
    Send,
    Smile,
    Trash2,
    Type,
    X
} from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

type Tool = 'text' | 'music' | 'sticker' | null;

export const CreateStoryScreen = ({ navigation }: any) => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    const [media, setMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Tools State
    const [activeTool, setActiveTool] = useState<Tool>(null);
    const [textContent, setTextContent] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [isTrashActive, setIsTrashActive] = useState(false);

    // Gesture Shared Values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const isDragging = useSharedValue(false);

    // Context for sticky gestures
    const savedScale = useSharedValue(1);
    const savedRotation = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    // Initialize expo-video player
    const player = useVideoPlayer(mediaType === 'video' ? media : '', (player: any) => {
        player.loop = true;
    });

    useEffect(() => {
        if (player && mediaType === 'video' && isFocused) {
            player.play();
        } else if (player) {
            player.pause();
        }
    }, [player, mediaType, isFocused]);

    const deleteContent = useCallback(() => {
        setTextContent('');
        translateX.value = 0;
        translateY.value = 0;
        scale.value = 1;
        rotation.value = 0;
        savedScale.value = 1;
        savedRotation.value = 0;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const pickMedia = async (useCamera = false) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Medya seçebilmek için izin vermelisiniz.');
            return;
        }

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.7,
            videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        };

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
            setMedia(result.assets[0].uri);
            setMediaType(result.assets[0].type as any);
        }
    };

    const handleShare = async () => {
        if (!media || !user) return;

        setIsUploading(true);
        console.log('--- Starting Story Upload (Cloudinary) ---');

        try {
            // 0. Fetch actual profil data from Firestore
            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            const profileData = profileSnap.exists() ? profileSnap.data() : null;

            const finalUsername = profileData?.username || user.displayName || 'Kullanıcı';
            const finalAvatar = profileData?.avatar_url || user.photoURL || '';

            console.log('Using Profile Data for Story:', { finalUsername, finalAvatar });

            const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dj4jcgbwv';
            const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '954885719674597';
            const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'IADI9j1XtSo0Du0t7f7F7loC_Y0';
            const folder = 'stories';
            const timestamp = Math.floor(Date.now() / 1000);

            // Create signature for signed upload
            const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
            const signature = sha1(paramsToSign + apiSecret);

            const formData = new FormData();
            formData.append('file', {
                uri: media,
                type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
                name: `story_${user.uid}_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
            } as any);
            formData.append('api_key', apiKey);
            formData.append('folder', folder);
            formData.append('timestamp', String(timestamp));
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cloudinary Story Upload Error:', errorText);
                throw new Error(`Cloudinary hatası (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            const contentUrl = result.secure_url;

            // 3. Create Story Doc in Firestore
            await addDoc(collection(db, 'stories'), {
                userId: user.uid,
                username: finalUsername,
                avatarUrl: finalAvatar,
                contentUrl,
                contentType: mediaType,
                text: textContent,
                textColor,
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                viewedBy: []
            });

            // Reward XP
            const { addXP } = useLevelStore.getState();
            await addXP(user.uid, 6);

            Alert.alert('Başarılı', 'Hikayen paylaşıldı!');
            navigation.goBack();
        } catch (error: any) {
            console.error('CRITICAL ERROR sharing story:', error);
            Alert.alert('Hata', `Hikaye paylaşılamadı: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const panGesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = context.value.x + event.translationX;
            translateY.value = context.value.y + event.translationY;

            // Check trash collision (bottom center)
            const trashY = height - 150;
            const currentY = height / 2 + translateY.value;
            if (currentY > trashY - 100 && Math.abs(translateX.value) < 100) {
                runOnJS(setIsTrashActive)(true);
            } else {
                runOnJS(setIsTrashActive)(false);
            }
        })
        .onEnd(() => {
            isDragging.value = false;
            const trashY = height - 150;
            const currentY = height / 2 + translateY.value;

            if (currentY > trashY - 100 && Math.abs(translateX.value) < 100) {
                runOnJS(deleteContent)();
            }
            runOnJS(setIsTrashActive)(false);
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const rotateGesture = Gesture.Rotation()
        .onUpdate((event) => {
            rotation.value = savedRotation.value + event.rotation;
        })
        .onEnd(() => {
            savedRotation.value = rotation.value;
        });

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

    const animatedTextStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}rad` }
        ],
        opacity: withSpring(isDragging.value ? 0.8 : 1),
    }));

    const renderTools = () => (
        <View style={[styles.toolbar, { top: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.toolBtn}>
                <X color="#fff" size={28} />
            </TouchableOpacity>

            <View style={styles.rightTools}>
                <TouchableOpacity onPress={() => setActiveTool('text')} style={[styles.toolBtn, activeTool === 'text' && styles.activeTool]}>
                    <Type color="#fff" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTool('sticker')} style={styles.toolBtn}>
                    <Smile color="#fff" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTool('music')} style={styles.toolBtn}>
                    <Music color="#fff" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOverlay = () => (
        <View style={styles.overlayContainer} pointerEvents="box-none">
            {textContent ? (
                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[styles.textOverlay, animatedTextStyle]}>
                        <Text style={[styles.previewText, { color: textColor }]}>{textContent}</Text>
                    </Animated.View>
                </GestureDetector>
            ) : null}
        </View>
    );

    const renderTrash = () => (
        <AnimatePresence>
            {(isTrashActive || isDragging.value) && (
                <MotiView
                    from={{ opacity: 0, scale: 0.5, translateY: 50 }}
                    animate={{ opacity: 1, scale: isTrashActive ? 1.3 : 1, translateY: 0 }}
                    exit={{ opacity: 0, scale: 0.5, translateY: 50 }}
                    style={[styles.trashContainer, { bottom: insets.bottom + 60 }]}
                >
                    <BlurView intensity={30} tint="dark" style={[styles.trashCircle, isTrashActive && { backgroundColor: '#ef4444' }]}>
                        <Trash2 color={isTrashActive ? "#fff" : "rgba(255,255,255,0.7)"} size={32} />
                    </BlurView>
                </MotiView>
            )}
        </AnimatePresence>
    );

    if (!media) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.selectionCenter}>
                        <MotiView
                            from={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <Text style={[styles.welcomeTitle, { color: theme.text, fontFamily: typography.display }]}>
                                Anını Paylaş
                            </Text>
                            <Text style={[styles.welcomeSub, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                Hikayene renk katmak için bir medya seç.
                            </Text>
                        </MotiView>

                        <View style={styles.selectionGrid}>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => pickMedia(true)}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.saffron }]}>
                                    <Camera size={32} color="#fff" />
                                </View>
                                <Text style={[styles.pickLabel, { color: theme.text }]}>Kamera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.pickBtn} onPress={() => pickMedia(false)}>
                                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
                                    <LucideImage size={32} color={isDark ? "#fff" : theme.text} />
                                </View>
                                <Text style={[styles.pickLabel, { color: theme.text }]}>Galeri</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.cancelBtn, { bottom: insets.bottom + 40 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={{ color: theme.secondaryText, fontSize: 16 }}>Vazgeç</Text>
                    </TouchableOpacity>
                </View>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View style={styles.previewContainer}>
                    {mediaType === 'video' ? (
                        <VideoView
                            player={player}
                            style={styles.fullMedia}
                            contentFit="cover"
                        />
                    ) : (
                        <Image source={{ uri: media }} style={styles.fullMedia} resizeMode="cover" />
                    )}

                    {renderTools()}
                    {renderOverlay()}
                    {renderTrash()}

                    <View style={[styles.bottomBar, { bottom: insets.bottom + 20 }]}>
                        <TouchableOpacity style={styles.saveLocalBtn}>
                            <Download color="#fff" size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={handleShare}
                            disabled={isUploading}
                        >
                            <BlurView intensity={30} tint="light" style={styles.shareBlur}>
                                {isUploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.shareBtnText}>Hikayen</Text>
                                        <Send color="#fff" size={18} />
                                    </>
                                )}
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <Modal visible={activeTool === 'text'} transparent animationType="fade">
                        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                            <TouchableOpacity style={styles.modalClose} onPress={() => setActiveTool(null)}>
                                <Check color="#fff" size={32} />
                            </TouchableOpacity>

                            <TextInput
                                style={[styles.textToolInput, { color: textColor }]}
                                placeholder="Bir şeyler yaz..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={textContent}
                                onChangeText={setTextContent}
                                multiline
                                autoFocus
                            />

                            <ScrollView horizontal style={styles.colorPicker} showsHorizontalScrollIndicator={false}>
                                {['#ffffff', '#000000', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'].map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.colorDot, { backgroundColor: c, borderWidth: textColor === c ? 2 : 0, borderColor: '#fff' }]}
                                        onPress={() => setTextColor(c)}
                                    />
                                ))}
                            </ScrollView>
                        </BlurView>
                    </Modal>
                </View>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0000009a',
    },
    selectionCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    welcomeTitle: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 12,
    },
    welcomeSub: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    selectionGrid: {
        flexDirection: 'row',
        gap: 30,
    },
    pickBtn: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pickLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    cancelBtn: {
        position: 'absolute',
        alignSelf: 'center',
    },
    previewContainer: {
        flex: 1,
    },
    fullMedia: {
        width: width,
        height: height,
    },
    toolbar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    rightTools: {
        flexDirection: 'row',
        gap: 16,
    },
    toolBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTool: {
        backgroundColor: colors.saffron,
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textOverlay: {
        padding: 20,
    },
    previewText: {
        fontSize: 38,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    saveLocalBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareBtn: {
        borderRadius: 30,
        overflow: 'hidden',
    },
    shareBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    shareBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalClose: {
        position: 'absolute',
        top: 60,
        right: 20,
    },
    textToolInput: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
    },
    colorPicker: {
        position: 'absolute',
        bottom: 60,
        maxHeight: 50,
    },
    colorDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginHorizontal: 8,
    },
    trashContainer: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 100,
    },
    trashCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

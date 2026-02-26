import { useIsFocused } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, MoreVertical, Share2, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    TouchableOpacity as RNReactNativeTouchableOpacity,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { deleteStory, markStoryAsViewed, Story } from '../../api/storyService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { SelectionOption, SelectionPopup } from '../common/SelectionPopup';
import { UserAvatar } from '../common/UserAvatar';

const { width, height } = Dimensions.get('window');

interface StoryViewerProps {
    visible: boolean;
    stories: Story[];
    initialIndex?: number;
    onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
    visible,
    stories,
    initialIndex = 0,
    onClose
}) => {
    const { user: currentUser } = useAuthStore();
    const { theme, isDark, typography } = useTheme();
    const isFocused = useIsFocused();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [viewersData, setViewersData] = useState<any[]>([]);
    const [isLoadingViewers, setIsLoadingViewers] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isMediaLoaded, setIsMediaLoaded] = useState(false);

    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const viewersTranslateY = useSharedValue(height);

    const currentStory = stories[currentIndex];
    const isOwner = currentUser?.uid === currentStory?.userId;

    const player = useVideoPlayer(currentStory?.contentType === 'video' ? currentStory.contentUrl : '', (player: any) => {
        player.loop = false;
    });

    const IMAGE_DURATION = 15000;
    const isClosing = React.useRef(false);

    const safeOnClose = useCallback(() => {
        if (isClosing.current) return;
        isClosing.current = true;
        if (player) {
            player.pause();
        }
        onClose();
    }, [onClose, player]);

    const transitionTo = useCallback((index: number, isAnimated: boolean = false, direction: 'next' | 'prev' | 'none' = 'none') => {
        if (index < 0 || index >= stories.length) {
            if (direction === 'next') {
                safeOnClose();
            } else if (direction === 'prev') {
                translateX.value = withSpring(0);
            }
            return;
        }

        if (isAnimated) {
            const targetX = direction === 'next' ? -width : direction === 'prev' ? width : 0;
            setIsPaused(true);
            translateX.value = withTiming(targetX, { duration: 400 }, () => {
                runOnJS(setCurrentIndex)(index);
                runOnJS(setProgress)(0);
                runOnJS(setIsMediaLoaded)(false);
                translateX.value = 0;
                runOnJS(setIsPaused)(false);
            });
        } else {
            setCurrentIndex(index);
            setProgress(0);
            setIsMediaLoaded(false);
            translateX.value = 0;
        }
    }, [stories, safeOnClose, width, translateX]);

    const handleNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            const nextStory = stories[currentIndex + 1];
            const isSameUser = nextStory.userId === currentStory.userId;
            transitionTo(currentIndex + 1, !isSameUser, 'next');
        } else {
            safeOnClose();
        }
    }, [currentIndex, stories, currentStory, transitionTo, safeOnClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            const prevStory = stories[currentIndex - 1];
            const isSameUser = prevStory.userId === currentStory.userId;
            transitionTo(currentIndex - 1, !isSameUser, 'prev');
        } else {
            translateX.value = withSpring(0);
        }
    }, [currentIndex, stories, currentStory, transitionTo, translateX]);

    const handleNextUser = useCallback(() => {
        const nextUserIdx = stories.findIndex((s, i) => i > currentIndex && s.userId !== currentStory.userId);
        if (nextUserIdx !== -1) {
            transitionTo(nextUserIdx, true, 'next');
        } else {
            safeOnClose();
        }
    }, [currentIndex, stories, currentStory, transitionTo, safeOnClose]);

    const handlePrevUser = useCallback(() => {
        const storiesReversed = [...stories].reverse();
        const prevUserStoryIdx = storiesReversed.findIndex((s, i) => {
            const rIdx = stories.length - 1 - i;
            return rIdx < currentIndex && s.userId !== currentStory.userId;
        });

        if (prevUserStoryIdx !== -1) {
            const rIdx = stories.length - 1 - prevUserStoryIdx;
            const targetUserId = stories[rIdx].userId;
            const firstIdx = stories.findIndex(s => s.userId === targetUserId);
            transitionTo(firstIdx, true, 'prev');
        } else {
            translateX.value = withSpring(0);
        }
    }, [currentIndex, stories, currentStory, transitionTo, translateX]);

    // Video status listener for media loading
    useEffect(() => {
        if (!player || currentStory?.contentType !== 'video') {
            if (currentStory?.contentType === 'image') setIsMediaLoaded(true);
            return;
        }
        const sub = player.addListener('statusChange', (payload: any) => {
            if (payload.status === 'readyToPlay' || payload.status === 'playing') {
                setIsMediaLoaded(true);
            }
        });
        return () => sub.remove();
    }, [player, currentStory?.contentType, currentIndex]);

    // Auto play/pause logic
    useEffect(() => {
        if (player && currentStory?.contentType === 'video' && visible && isFocused && !isPaused && !showViewers && !showOptions) {
            player.play();
        } else if (player) {
            player.pause();
        }
    }, [player, currentStory, visible, isFocused, isPaused, showViewers, showOptions]);

    // Initial load and reset
    useEffect(() => {
        if (visible) {
            isClosing.current = false;
            setCurrentIndex(initialIndex);
            setProgress(0);
            setIsPaused(false);
            setIsMediaLoaded(false);
            translateY.value = 0;
            translateX.value = 0;
            opacity.value = 1;
            scale.value = 1;
            setShowOptions(false);
            setShowViewers(false);
        }
    }, [visible, initialIndex, translateY, translateX, opacity, scale]);

    // Progress and mark as viewed logic
    useEffect(() => {
        if (visible && currentStory && currentUser && currentUser.uid !== currentStory.userId) {
            markStoryAsViewed(currentStory.id, currentUser.uid);
        }
    }, [visible, currentIndex, currentStory?.id]);

    useEffect(() => {
        let timer: any;
        if (visible && !isPaused && !showViewers && !showOptions && isMediaLoaded) {
            const interval = 50;

            timer = setInterval(() => {
                if (currentStory.contentType === 'video' && player) {
                    const videoDuration = player.duration;
                    const currentTime = player.currentTime;

                    if (videoDuration > 0) {
                        const newProgress = (currentTime / videoDuration) * 100;
                        if (newProgress >= 99.8) {
                            clearInterval(timer);
                            handleNext();
                            return;
                        }
                        setProgress(Math.min(newProgress, 100));
                    }
                } else {
                    const step = (interval / IMAGE_DURATION) * 100;
                    setProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(timer);
                            handleNext();
                            return 100;
                        }
                        return prev + step;
                    });
                }
            }, interval);
        }
        return () => clearInterval(timer);
    }, [visible, currentIndex, isPaused, showViewers, showOptions, isMediaLoaded, player, handleNext, currentStory?.contentType]);

    useEffect(() => {
        const subscription = player.addListener('playToEnd', () => {
            handleNext();
        });
        return () => subscription.remove();
    }, [player, handleNext]);

    const dismissViewer = useCallback(() => {
        'worklet';
        translateY.value = withTiming(height, { duration: 300 }, () => {
            runOnJS(safeOnClose)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
    }, [translateY, height, opacity, scale, safeOnClose]);

    const fetchViewers = async () => {
        if (!currentStory?.viewedBy || currentStory.viewedBy.length === 0) {
            setViewersData([]);
            return;
        }

        setIsLoadingViewers(true);
        try {
            const viewersIds = currentStory.viewedBy.slice(0, 50);
            const q = query(collection(db, 'profiles'), where('__name__', 'in', viewersIds));
            const querySnapshot = await getDocs(q);
            const profiles = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setViewersData(profiles);
        } catch (error) {
            console.error('Error fetching viewers:', error);
        } finally {
            setIsLoadingViewers(false);
        }
    };

    const handleActivityPress = () => {
        setIsPaused(true);
        fetchViewers();
        setShowViewers(true);
        viewersTranslateY.value = withTiming(0, { duration: 200 });
    };

    const handleCloseViewers = () => {
        viewersTranslateY.value = withTiming(height, { duration: 200 }, () => {
            runOnJS(setShowViewers)(false);
            runOnJS(setIsPaused)(false);
        });
    };

    const handleOptionsPress = () => {
        // Pause video immediately when options are opened to stop both video and audio
        setIsPaused(true);
        if (player && typeof player.pause === 'function') {
            try { player.pause(); } catch { /* ignore */ }
        }
        setShowOptions(true);
    };

    const storyOptions: SelectionOption[] = [
        {
            label: 'Hikayeyi Sil',
            type: 'destructive',
            icon: <Trash2 size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
            onPress: () => {
                Alert.alert(
                    'Hikayeyi Sil',
                    'Bu hikayeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
                    [
                        { text: 'İptal', style: 'cancel', onPress: () => setIsPaused(false) },
                        {
                            text: 'Sil',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    await deleteStory(currentStory.id);
                                    handleNext();
                                } catch (err) {
                                    Alert.alert('Hata', 'Hikaye silinemedi.');
                                    setIsPaused(false);
                                }
                            }
                        }
                    ]
                );
            }
        },
        {
            label: 'Paylaş',
            icon: <Share2 size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
            onPress: async () => {
                try {
                    await Share.share({
                        message: `Neyesem'deki bu hikayeye göz at! ${currentStory.contentUrl || ''}`,
                        url: currentStory.contentUrl, // Supported on iOS
                    });
                } catch (error) {
                    console.error('Share error:', error);
                } finally {
                    setIsPaused(false);
                }
            }
        },
        {
            label: 'İptal',
            type: 'cancel',
            onPress: () => {
                setIsPaused(false);
                setShowOptions(false);
            }
        }
    ];

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
                translateX.value = event.translationX;
            } else if (event.translationY > 0) {
                translateY.value = event.translationY;
                opacity.value = interpolate(event.translationY, [0, 500], [1, 0.4], Extrapolate.CLAMP);
                scale.value = interpolate(event.translationY, [0, 500], [1, 0.7], Extrapolate.CLAMP);
            }
        })
        .onEnd((event) => {
            const absX = Math.abs(event.translationX);
            const absY = Math.abs(event.translationY);

            if (absX > absY) {
                // Horizontal Swipe -> User Transition
                if (event.translationX > 80) {
                    runOnJS(handlePrevUser)();
                } else if (event.translationX < -80) {
                    runOnJS(handleNextUser)();
                } else {
                    translateX.value = withSpring(0);
                }
            } else if (event.translationY > 150 || event.velocityY > 500) {
                // Vertical Swipe -> Dismiss
                dismissViewer();
            } else {
                translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
                opacity.value = withTiming(1);
                scale.value = withTiming(1);
            }
        });

    const tapGesture = Gesture.Tap()
        .onEnd((event) => {
            if (event.x < width / 3) {
                runOnJS(handlePrev)();
            } else {
                runOnJS(handleNext)();
            }
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(200)
        .onStart(() => {
            runOnJS(setIsPaused)(true);
        })
        .onEnd((_event, success) => {
            if (success) {
                runOnJS(setIsPaused)(false);
            }
        });

    const composedGesture = Gesture.Simultaneous(panGesture, Gesture.Exclusive(longPressGesture, tapGesture));

    const dismissAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
        borderRadius: interpolate(translateY.value, [0, 100], [0, 40], Extrapolate.CLAMP),
    }));

    const mediaAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(
            translateX.value,
            [-width, 0, width],
            [90, 0, -90],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { perspective: 1000 },
                { translateX: translateX.value },
                { rotateY: `${rotateY}deg` },
            ]
        };
    });

    const viewersAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: viewersTranslateY.value }
        ]
    }));

    if (!currentStory && visible) {
        safeOnClose();
        return null;
    }

    if (!currentStory) return null;

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="none"
                onRequestClose={safeOnClose}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <StatusBar hidden />
                    <View style={styles.modalBg}>
                        <Animated.View style={[styles.container, dismissAnimatedStyle]}>
                            <GestureDetector gesture={composedGesture}>
                                <View style={StyleSheet.absoluteFill}>
                                    <View style={StyleSheet.absoluteFill}>
                                        <Animated.View style={[StyleSheet.absoluteFill, mediaAnimatedStyle]}>
                                            <View style={styles.mediaContainer} pointerEvents="none">
                                                {currentStory.contentType === 'video' ? (
                                                    <VideoView
                                                        player={player}
                                                        key={`video-${currentStory.id}`}
                                                        style={styles.media}
                                                        contentFit="cover"
                                                        nativeControls={false}
                                                    />
                                                ) : (
                                                    <Image
                                                        source={{ uri: currentStory.contentUrl }}
                                                        key={`image-${currentStory.id}`}
                                                        style={styles.media}
                                                        resizeMode="cover"
                                                        onLoad={() => setIsMediaLoaded(true)}
                                                    />
                                                )}
                                            </View>
                                        </Animated.View>
                                    </View>
                                </View>
                            </GestureDetector>

                            <View
                                style={[styles.overlay, { paddingTop: insets.top }]}
                                pointerEvents="box-none"
                            >
                                <View style={styles.headerGlassContainer}>
                                    <BlurView intensity={35} tint="dark" style={styles.headerBlur}>
                                        <View style={styles.progressBarContainer}>
                                            {stories.map((_, index) => (
                                                <View key={index} style={styles.progressBarBackground}>
                                                    <View
                                                        style={[
                                                            styles.progressBarFill,
                                                            {
                                                                width: index === currentIndex
                                                                    ? `${progress}%`
                                                                    : index < currentIndex ? '100%' : '0%'
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.header}>
                                            <View style={styles.userInfo}>
                                                <UserAvatar
                                                    userId={currentStory.userId}
                                                    size={36}
                                                    style={styles.userAvatar}
                                                />
                                                <View>
                                                    <Text style={styles.username}>{currentStory.username}</Text>
                                                    <Text style={styles.timestamp}>{formatTime(currentStory.createdAt)}</Text>
                                                </View>
                                            </View>
                                            <RNReactNativeTouchableOpacity
                                                onPress={onClose}
                                                style={styles.closeButton}
                                            >
                                                <X color="#fff" size={28} />
                                            </RNReactNativeTouchableOpacity>
                                        </View>
                                    </BlurView>
                                </View>

                                {currentStory.text && (
                                    <View style={styles.textOverlay} pointerEvents="none">
                                        <Text style={[styles.storyText, { color: currentStory.textColor || '#fff' }]}>
                                            {currentStory.text}
                                        </Text>
                                    </View>
                                )}

                                {isOwner && (
                                    <View style={[styles.bottomBarGlassContainer, { bottom: insets.bottom + 10 }]}>
                                        <BlurView intensity={35} tint="dark" style={styles.bottomBlur}>
                                            <View style={styles.bottomBarContent}>
                                                <RNReactNativeTouchableOpacity style={styles.bottomBarButton} onPress={handleActivityPress}>
                                                    <Eye color="#fff" size={20} />
                                                    <Text style={styles.bottomBarText}>
                                                        {currentStory.viewedBy?.length || 0}
                                                    </Text>
                                                </RNReactNativeTouchableOpacity>
                                                <RNReactNativeTouchableOpacity style={styles.bottomBarButton} onPress={handleOptionsPress}>
                                                    <MoreVertical color="#fff" size={20} />
                                                    <Text style={styles.bottomBarText}>Seçenekler</Text>
                                                </RNReactNativeTouchableOpacity>
                                            </View>
                                        </BlurView>
                                    </View>
                                )}
                            </View>
                        </Animated.View>

                        <Modal
                            visible={showViewers}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={handleCloseViewers}
                        >
                            <View style={styles.viewersModalContainer}>
                                <RNReactNativeTouchableOpacity
                                    activeOpacity={1}
                                    style={StyleSheet.absoluteFill}
                                    onPress={handleCloseViewers}
                                >
                                    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                </RNReactNativeTouchableOpacity>
                                <Animated.View style={[styles.viewersContent, viewersAnimatedStyle, { backgroundColor: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                                    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                                        <View style={[styles.viewersHeader, { borderBottomColor: theme.border }]}>
                                            <Text style={[styles.viewersTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>Görüntüleyenler</Text>
                                            <TouchableOpacity onPress={handleCloseViewers}>
                                                <X color={theme.text} size={24} />
                                            </TouchableOpacity>
                                        </View>

                                        <FlatList
                                            data={viewersData}
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <View style={styles.viewerItem}>
                                                    <UserAvatar
                                                        userId={item.id}
                                                        size={38}
                                                        style={styles.viewerAvatar}
                                                    />
                                                    <View>
                                                        <Text style={[styles.viewerName, { color: theme.text, fontFamily: typography.bodyMedium }]}>{item.display_name}</Text>
                                                        <Text style={[styles.viewerUsername, { color: theme.secondaryText }]}>@{item.username}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            ListEmptyComponent={
                                                <Text style={[styles.emptyViewers, { color: theme.secondaryText }]}>
                                                    {isLoadingViewers ? 'Yükleniyor...' : 'Henüz kimse görüntülemedi.'}
                                                </Text>
                                            }
                                            contentContainerStyle={styles.viewersList}
                                        />
                                    </SafeAreaView>
                                </Animated.View>
                            </View>
                        </Modal>

                        <SelectionPopup
                            visible={showOptions}
                            title="Hikaye Seçenekleri"
                            options={storyOptions}
                        onClose={() => {
                                // Close options and resume playback
                                setShowOptions(false);
                                setIsPaused(false);
                                try {
                                    if (player && typeof player.play === 'function') {
                                        player.play();
                                    }
                                } catch { /* ignore */ }
                            }}
                        />
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    mediaContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    media: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 140,
    },
    headerGlassContainer: {
        marginTop: 10,
        paddingHorizontal: 8,
    },
    headerBlur: {
        borderRadius: 28,
        overflow: 'hidden',
        paddingBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    progressBarContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 4,
    },
    progressBarBackground: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarFallback: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    timestamp: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },
    textOverlay: {
        position: 'absolute',
        top: height * 0.4,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    storyText: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    bottomBarGlassContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        right: 20,
    },
    bottomBlur: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bottomBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
    },
    bottomBarButton: {
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    bottomBarText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    viewersModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    viewersContent: {
        height: height * 0.6,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    viewersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 0.5,
    },
    viewersTitle: {
        fontSize: 18,
    },
    viewersList: {
        padding: 24,
    },
    viewerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
    },
    viewerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    viewerName: {
        fontSize: 15,
    },
    viewerUsername: {
        fontSize: 13,
    },
    emptyViewers: {
        textAlign: 'center',
        marginTop: 60,
        fontSize: 14,
    },
});

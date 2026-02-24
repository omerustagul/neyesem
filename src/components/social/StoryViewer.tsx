import { useIsFocused } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, MoreVertical, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { db } from '../../api/firebase';
import { Story, deleteStory, markStoryAsViewed } from '../../api/storyService';
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

    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    const currentStory = stories[currentIndex];
    const isOwner = currentUser?.uid === currentStory?.userId;

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            setProgress(0);
            setIsPaused(false);
            translateY.value = 0;
            opacity.value = 1;
            scale.value = 1;
            setShowOptions(false);
            setShowViewers(false);
        }
    }, [visible, initialIndex]);

    // Mark as viewed
    useEffect(() => {
        if (visible && currentStory && currentUser && currentUser.uid !== currentStory.userId) {
            markStoryAsViewed(currentStory.id, currentUser.uid);
        }
    }, [visible, currentIndex, currentStory?.id]);

    useEffect(() => {
        let timer: any;
        if (visible && !isPaused && !showViewers && !showOptions) {
            const duration = 5000;
            const interval = 50;
            const step = (interval / duration) * 100;

            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + step;
                });
            }, interval);
        }
        return () => clearInterval(timer);
    }, [visible, currentIndex, isPaused, showViewers, showOptions]);

    const handleNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    const dismissViewer = () => {
        'worklet';
        translateY.value = withTiming(height, { duration: 300 }, () => {
            runOnJS(onClose)();
        });
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
    };

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
            console.error("Error fetching viewers:", error);
        } finally {
            setIsLoadingViewers(false);
        }
    };

    const handleActivityPress = () => {
        setIsPaused(true);
        fetchViewers();
        setShowViewers(true);
    };

    const handleOptionsPress = () => {
        setIsPaused(true);
        setShowOptions(true);
    };

    const storyOptions: SelectionOption[] = [
        {
            label: 'Hikayeyi Sil',
            type: 'destructive',
            onPress: async () => {
                try {
                    await deleteStory(currentStory.id);
                    handleNext();
                } catch (err) {
                    Alert.alert('Hata', 'Hikaye silinemedi.');
                }
            }
        },
        {
            label: 'Paylaş',
            onPress: () => {
                // Simüle edildi
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

    // Gestures
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
                opacity.value = interpolate(event.translationY, [0, 500], [1, 0.4], Extrapolate.CLAMP);
                scale.value = interpolate(event.translationY, [0, 500], [1, 0.7], Extrapolate.CLAMP);
            }
        })
        .onEnd((event) => {
            if (event.translationY > 150 || event.velocityY > 500) {
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
        .onEnd(() => {
            runOnJS(setIsPaused)(false);
        });

    const composedGesture = Gesture.Simultaneous(panGesture, Gesture.Exclusive(longPressGesture, tapGesture));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
        borderRadius: interpolate(translateY.value, [0, 100], [0, 40], Extrapolate.CLAMP),
    }));

    if (!currentStory) return null;

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="none"
                onRequestClose={onClose}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <StatusBar hidden />
                    <View style={styles.modalBg}>
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[styles.container, animatedStyle]}>
                                {/* Media Content */}
                                <View style={styles.mediaContainer} pointerEvents="none">
                                    {currentStory.contentType === 'video' ? (
                                        <Video
                                            source={{ uri: currentStory.contentUrl }}
                                            style={styles.media}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={visible && isFocused && !isPaused && !showViewers && !showOptions}
                                            isLooping={false}
                                        />
                                    ) : (
                                        <Image
                                            source={{ uri: currentStory.contentUrl }}
                                            style={styles.media}
                                            resizeMode="cover"
                                        />
                                    )}
                                </View>

                                {/* Overlays */}
                                <SafeAreaView style={styles.overlay} pointerEvents="box-none">
                                    {/* Top Decoration */}
                                    <BlurView intensity={30} tint="dark" style={styles.topGradient} />

                                    {/* Progress Bars */}
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

                                    {/* Header */}
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
                                        <TouchableOpacity
                                            onPress={() => {
                                                runOnJS(onClose)();
                                            }}
                                            style={styles.closeButton}
                                        >
                                            <X color="#fff" size={28} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Story Text Overlay */}
                                    {currentStory.text && (
                                        <View style={styles.textOverlay} pointerEvents="none">
                                            <Text style={[styles.storyText, { color: currentStory.textColor || '#fff' }]}>
                                                {currentStory.text}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Owner Bottom Bar */}
                                    {isOwner && (
                                        <View style={styles.bottomBar}>
                                            <TouchableOpacity style={styles.bottomBarButton} onPress={handleActivityPress}>
                                                <Eye color="#fff" size={24} />
                                                <Text style={styles.bottomBarText}>
                                                    {currentStory.viewedBy?.length || 0}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.bottomBarButton} onPress={handleOptionsPress}>
                                                <MoreVertical color="#fff" size={24} />
                                                <Text style={styles.bottomBarText}>Seçenekler</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </SafeAreaView>
                            </Animated.View>
                        </GestureDetector>

                        {/* Viewers Modal */}
                        <Modal
                            visible={showViewers}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => { setShowViewers(false); setIsPaused(false); }}
                        >
                            <View style={styles.viewersModalContainer}>
                                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                <SafeAreaView style={[styles.viewersContent, { backgroundColor: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                                    <View style={[styles.viewersHeader, { borderBottomColor: theme.border }]}>
                                        <Text style={[styles.viewersTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>Görüntüleyenler</Text>
                                        <TouchableOpacity onPress={() => { setShowViewers(false); setIsPaused(false); }}>
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
                            </View>
                        </Modal>
                    </View>
                </GestureHandlerRootView>
            </Modal>

            <SelectionPopup
                visible={showOptions}
                title="Hikaye Seçenekleri"
                options={storyOptions}
                onClose={() => {
                    setShowOptions(false);
                    setIsPaused(false);
                }}
            />
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
        opacity: 0.6,
    },
    progressBarContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        gap: 4,
    },
    progressBarBackground: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1,
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
        paddingHorizontal: 16,
        paddingTop: 16,
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
        borderWidth: 1.5,
        borderColor: '#fff',
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
        padding: 8,
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
    bottomBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    bottomBarButton: {
        alignItems: 'center',
        gap: 4,
        padding: 10,
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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

import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowLeft, Play, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post, subscribeToFeedPosts } from '../../api/postService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const RelatedVideoItem = ({ item, navigation }: { item: Post, navigation: any }) => {
    const player = useVideoPlayer(item.content_url || '', (player: any) => {
        player.pause();
    });

    return (
        <TouchableOpacity
            style={styles.videoItem}
            onPress={() => navigation.navigate('Reels', { initialPostId: item.id })}
        >
            {item.content_url && (item.content_type === 'video' || item.content_type === 'embed') ? (
                <VideoView
                    player={player}
                    style={styles.gridVideo}
                    contentFit="cover"
                    nativeControls={false}
                />
            ) : item.content_url && item.content_type === 'image' ? (
                <ExpoImage
                    source={{ uri: item.content_url }}
                    style={styles.gridVideo}
                    contentFit="cover"
                />
            ) : (
                <View style={[styles.gridVideo, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                    <Play size={24} color="#fff" />
                </View>
            )}
            <View style={styles.videoOverlay}>
                <Text style={styles.videoUser} numberOfLines={1}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const FoodDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { theme, typography, isDark } = useTheme();
    const { post } = route.params;

    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToFeedPosts((fetchedPosts) => {
            // Filter posts that have the same "food" feel (for now just all video posts except the current one)
            const videos = fetchedPosts.filter(p => p.id !== post.id && (p.content_type === 'video' || p.content_type === 'embed'));
            setRelatedPosts(videos);
        });
        return () => unsubscribe();
    }, [post.id]);

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft color={theme.text} size={24} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                Yemek Detayı
            </Text>
            <View style={{ width: 40 }} />
        </View>
    );

    const renderAIInfo = () => (
        <View style={[styles.aiSection, { backgroundColor: isDark ? 'rgba(20, 133, 74, 0.1)' : 'rgba(20, 133, 74, 0.05)' }]}>
            <View style={styles.aiHeader}>
                <Sparkles size={20} color={colors.saffron} />
                <Text style={[styles.aiTitle, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>
                    Yapay Zeka Analizi
                </Text>
            </View>
            <Text style={[styles.aiText, { color: theme.text, fontFamily: typography.body }]}>
                {post.username} tarafından paylaşılan bu nefis tarif, geleneksel aromaları modern tekniklerle harmanlıyor.
                {post.calories ? ` ${post.calories} kaloriye sahip bu yemek,` : ''}
                {post.protein ? ` ${post.protein} protein içeriğiyle` : ''} oldukça besleyici bir seçenek.
                {post.difficulty === 'Kolay' ? 'Hızlıca hazırlayabileceğiniz pratik bir tarif.' : 'Hazırlanması biraz özen istese de sonucuna kesinlikle değecek bir lezzet.'}
            </Text>
        </View>
    );

    const renderVideoItem = ({ item }: { item: Post }) => (
        <RelatedVideoItem item={item} navigation={navigation} />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
                {/* Hero section or info */}
                <View style={styles.contentPadding}>
                    <Text style={[styles.foodName, { color: theme.text, fontFamily: typography.display }]}>
                        {post.username}'in Mutfağından
                    </Text>
                    {renderAIInfo()}

                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        İlgili Videolar
                    </Text>
                </View>

                <FlatList
                    data={relatedPosts}
                    renderItem={renderVideoItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.gridContainer}
                />
            </ScrollView>
        </View>
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
        paddingBottom: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
    },
    contentPadding: {
        padding: 16,
    },
    foodName: {
        fontSize: 24,
        marginBottom: 20,
    },
    aiSection: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 25,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    aiTitle: {
        fontSize: 16,
    },
    aiText: {
        fontSize: 14,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 15,
    },
    gridContainer: {
        paddingHorizontal: 2,
    },
    videoItem: {
        width: width / 3 - 4,
        height: (width / 3 - 4) * 1.5,
        margin: 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    gridVideo: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoUser: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});

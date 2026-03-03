import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Post } from '../../api/postService';
import { getMoodById } from '../../constants/moodModes';
import { useMoodFeed } from '../../hooks/useMoodFeed';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { VideoPostCard } from '../feed/VideoPostCard';

type Props = {
    moodId: string;
};

export default function MoodFeedList({ moodId }: Props) {
    const { theme, typography } = useTheme();
    const mode = getMoodById(moodId);

    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useMoodFeed(moodId);

    const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

    const handleInteractionStub = (type: string) => {
        // In a real app, these would open modals or perform actions
        // Alert.alert('Bilgi', `${type} özelliği şu an sadece ana akışta aktif.`);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.saffron} size="large" />
                <Text style={[styles.loadingText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {mode?.emoji} {mode?.name} tarifleri getiriliyor...
                </Text>
            </View>
        );
    }

    if (allPosts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: typography.display }]}>
                    Henüz içerik yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    Bu mod için ilk tarifi sen paylaş!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.feedHeader}>
                <Text style={[styles.feedTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    {mode?.emoji} {mode?.name} için {allPosts.length}+ tarif
                </Text>
            </View>

            <FlatList
                data={allPosts as Post[]}
                scrollEnabled={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <VideoPostCard
                        post={item}
                        isLiked={false}
                        onLike={() => handleInteractionStub('Beğen')}
                        onComment={() => handleInteractionStub('Yorum')}
                        onSave={() => handleInteractionStub('Kaydet')}
                        onShare={() => handleInteractionStub('Paylaş')}
                    />
                )}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isFetchingNextPage
                        ? <ActivityIndicator color={colors.saffron} style={{ marginVertical: 16 }} />
                        : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    container: {
        marginTop: 16,
        paddingHorizontal: 0,
    },
    feedHeader: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    feedTitle: {
        fontSize: 15,
    },
});

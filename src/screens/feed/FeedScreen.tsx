import React from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmbedCard } from '../../components/feed/EmbedCard';
import { useTheme } from '../../theme/ThemeProvider';

const MOCK_DATA = [
    {
        id: '1',
        url: 'https://www.instagram.com/reels/C3fJ_v7I_9v/',
        user: { username: 'gurme_seyyah' },
        caption: 'İstanbul\'un en iyi dönercisi burası olabilir mi? 🥙📥',
        likes: 1240,
        comments: 85,
    },
    {
        id: '2',
        url: 'https://www.tiktok.com/@bay_oreon/video/7279313838029589765',
        user: { username: 'chef_ali' },
        caption: 'Evde hızlı ve pratik makarna tarifi! ✨',
        likes: 850,
        comments: 42,
    },
];

export const FeedScreen = () => {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const headerHeight = 64 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <FlatList
                data={MOCK_DATA}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <EmbedCard {...item} />}
                contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                bounces={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
        paddingHorizontal: 12,
    },
});

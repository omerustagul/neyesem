import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const PlaceholderScreen = ({ name }: { name: string }) => {
    const { theme, typography } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.text, { color: theme.text, fontFamily: typography.display }]}>
                {name} Screen
            </Text>
        </View>
    );
};

export const FeedScreen = () => <PlaceholderScreen name="Feed" />;
export const ExploreScreen = () => <PlaceholderScreen name="Explore" />;
export const ListsScreen = () => <PlaceholderScreen name="Lists" />;
export const ProfileScreen = () => <PlaceholderScreen name="Profile" />;
export const CreateScreen = () => <PlaceholderScreen name="Create" />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
    },
});

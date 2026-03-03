import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEmbed } from '../../hooks/useEmbed';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { CommentButton, LikeButton, SaveButton, ShareButton } from '../social/SocialButtons';

const { width } = Dimensions.get('window');

interface EmbedCardProps {
    url: string;
    user: {
        username: string;
        avatar_url?: string;
    };
    caption?: string;
    likes: number;
    comments: number;
    onLike?: () => void;
    onComment?: () => void;
    onSave?: () => void;
    onShare?: () => void;
}

export const EmbedCard: React.FC<EmbedCardProps> = ({
    url,
    user,
    caption,
    likes,
    comments,
    onLike,
    onComment,
    onSave,
    onShare
}) => {
    const { theme, typography } = useTheme();
    const { embedHtml, platform, isLoading, error } = useEmbed(url);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.saffron }]} />
                    <Text style={[styles.username, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        {user.username}
                    </Text>
                </View>
                <Text style={[styles.platform, { color: colors.oliveLight }]}>
                    {platform.toUpperCase()}
                </Text>
            </View>

            {/* Content */}
            <View style={styles.embedContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={{ color: colors.oliveLight }}>Yükleniyor...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={{ color: colors.spiceRed }}>İçerik yüklenemedi.</Text>
                    </View>
                ) : (
                    <WebView
                        originWhitelist={['*']}
                        source={{
                            html: `
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { margin: 0; padding: 0; display: flex; justify-content: center; background: transparent; }
                    iframe { max-width: 100% !important; width: 100% !important; border: none !important; }
                  </style>
                </head>
                <body>
                  ${embedHtml}
                  <script async src="//www.instagram.com/embed.js"></script>
                  <script async src="https://www.tiktok.com/embed.js"></script>
                </body>
              </html>
            ` }}
                        style={styles.webview}
                        scrollEnabled={false}
                    />
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <LikeButton count={likes} onLike={onLike} />
                    <CommentButton count={comments} onPress={onComment} />
                    <ShareButton onShare={onShare} />
                </View>
                <SaveButton onSave={onSave} />
            </View>

            {/* Caption - Moved below actions for Instagram style */}
            {caption && (
                <View style={styles.captionContainer}>
                    <Text style={[styles.caption, { color: theme.text, fontFamily: typography.body }]}>
                        <Text style={{ fontFamily: typography.bodyMedium }}>{user.username} </Text>
                        {caption}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24, // Increased spacing between posts
        padding: 0,
        overflow: 'hidden',
        width: width, // Ensure full width
    },
    header: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    username: {
        fontSize: 14,
    },
    platform: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    embedContainer: {
        width: '100%',
        height: width, // Square aspect ratio or modify based on content
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    webview: {
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    captionContainer: {
        padding: 12,
    },
    caption: {
        fontSize: 14,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        paddingTop: 0,
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

import * as VideoThumbnails from 'expo-video-thumbnails';
import { Play } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface VideoThumbnailProps {
    videoUri: string;
    thumbnailUri?: string | null;
    style?: ViewStyle;
    showPlayIcon?: boolean;
}

// Simple in-memory cache for generated thumbnails
const thumbnailCache: Record<string, string> = {};

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
    videoUri,
    thumbnailUri,
    style,
    showPlayIcon = true,
}) => {
    const [generatedUri, setGeneratedUri] = useState<string | null>(
        thumbnailUri || thumbnailCache[videoUri] || null
    );

    useEffect(() => {
        // If we already have a thumbnail, use it
        if (thumbnailUri) {
            setGeneratedUri(thumbnailUri);
            return;
        }

        // Check cache
        if (thumbnailCache[videoUri]) {
            setGeneratedUri(thumbnailCache[videoUri]);
            return;
        }

        // Generate thumbnail from video
        let mounted = true;
        const generateThumbnail = async () => {
            try {
                const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
                    time: 1000,
                    quality: 0.5,
                });
                if (mounted) {
                    thumbnailCache[videoUri] = uri;
                    setGeneratedUri(uri);
                }
            } catch (error) {
                // Silently fail — will show placeholder
                console.warn('Thumbnail generation failed for:', videoUri);
            }
        };

        generateThumbnail();
        return () => { mounted = false; };
    }, [videoUri, thumbnailUri]);

    if (generatedUri) {
        return (
            <View style={[styles.container, style]}>
                <Image source={{ uri: generatedUri }} style={styles.image} />
                {showPlayIcon && (
                    <View style={styles.playOverlay}>
                        <View style={styles.playButton}>
                            <Play size={16} color="#fff" fill="#fff" />
                        </View>
                    </View>
                )}
            </View>
        );
    }

    // Placeholder while loading
    return (
        <View style={[styles.container, styles.placeholder, style]}>
            {showPlayIcon && (
                <Play size={24} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.3)" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        backgroundColor: colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

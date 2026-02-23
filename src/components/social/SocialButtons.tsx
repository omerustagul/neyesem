import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface SocialButtonProps {
    icon: React.ReactNode;
    label?: string | number;
    onPress: () => void;
    active?: boolean;
    activeColor?: string;
    labelColor?: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon, label, onPress, labelColor }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(1.2, {}, () => {
            scale.value = withSpring(1);
        });
        onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.button}>
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                {icon}
            </Animated.View>
            {label !== undefined && (
                <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
};

export const LikeButton = ({ count, isLiked, onLike }: any) => {
    const { theme } = useTheme();
    return (
        <SocialButton
            icon={<Heart color={isLiked ? colors.spiceRed : theme.text} fill={isLiked ? colors.spiceRed : 'transparent'} size={24} />}
            label={count}
            onPress={onLike}
            labelColor={theme.text}
        />
    );
};

export const CommentButton = ({ count, onPress }: any) => {
    const { theme } = useTheme();
    return (
        <SocialButton
            icon={<MessageCircle color={theme.text} size={24} />}
            label={count}
            onPress={onPress}
            labelColor={theme.text}
        />
    );
};

export const SaveButton = ({ isSaved, onSave }: any) => {
    const { theme } = useTheme();
    return (
        <SocialButton
            icon={<Bookmark color={isSaved ? colors.saffron : theme.text} fill={isSaved ? colors.saffron : 'transparent'} size={24} />}
            onPress={onSave}
            labelColor={theme.text}
        />
    );
};

export const ShareButton = ({ onShare }: any) => {
    const { theme } = useTheme();
    return (
        <SocialButton
            icon={<Send color={theme.text} size={24} />}
            onPress={onShare}
            labelColor={theme.text}
        />
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    iconContainer: {
        padding: 4,
    },
    label: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
    },
});

import { Award, ChefHat, Crown, Flame, Trophy, Utensils } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useBadgeInfoStore } from '../../store/badgeInfoStore';

interface LevelBadgeProps {
    level: number;
    size?: number;
    disabled?: boolean;
}

/**
 * Level tier configuration — icon, gradient colors, glow color.
 * No emojis. Pure icon + gradient design.
 */
export const getLevelTier = (level: number): {
    Icon: React.ComponentType<any>;
    bg: string;
    border: string;
    glow: string;
    iconColor: string;
} => {
    if (level >= 10) return {
        Icon: Trophy,
        bg: '#f59e0b',
        border: '#fbbf24',
        glow: '#f59e0b',
        iconColor: '#fff',
    };
    if (level === 9) return {
        Icon: Crown,
        bg: '#ef4444',
        border: '#f87171',
        glow: '#ef4444',
        iconColor: '#fff',
    };
    if (level >= 7) return {
        Icon: Award,
        bg: '#3b82f6',
        border: '#60a5fa',
        glow: '#3b82f6',
        iconColor: '#fff',
    };
    if (level >= 5) return {
        Icon: Flame,
        bg: '#2dd4bf',
        border: '#5eead4',
        glow: '#2dd4bf',
        iconColor: '#fff',
    };
    if (level >= 3) return {
        Icon: ChefHat,
        bg: '#64748b',
        border: '#94a3b8',
        glow: '#64748b',
        iconColor: '#fff',
    };
    return {
        Icon: Utensils,
        bg: '#475569',
        border: '#64748b',
        glow: 'transparent',
        iconColor: '#fff',
    };
};

/** Returns the badge color for a given level (used externally for username coloring etc.) */
export const getLevelBadgeColor = (level: number): string => {
    const tier = getLevelTier(level);
    return tier.bg;
};

/** Returns `'#f59e0b'` (gold) for level 10 users, otherwise `undefined`. */
export const getGoldUsernameColor = (level: number): string | undefined =>
    level >= 10 ? '#f59e0b' : undefined;

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 40, disabled = false }) => {
    const tier = getLevelTier(level);
    const { Icon, bg, border, glow } = tier;
    const iconSize = size * 0.52;
    const { showBadgeInfo } = useBadgeInfoStore();

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !disabled && showBadgeInfo('level', level)}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bg,
                    borderColor: border,
                    shadowColor: glow,
                }
            ]}>
            <Icon
                size={iconSize}
                color="#fff"
                strokeWidth={2.2}
                fill={level >= 10 ? 'rgba(255,255,255,0.25)' : 'transparent'}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 4,
    },
});

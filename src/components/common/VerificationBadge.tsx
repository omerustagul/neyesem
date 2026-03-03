import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useBadgeInfoStore } from '../../store/badgeInfoStore';

interface VerificationBadgeProps {
    size?: number;
    style?: any;
    disabled?: boolean;
}

/**
 * Verification badge shown next to verified usernames.
 * A user is verified if they have is_verified=true OR level >= 10.
 * Uses a Lucide Check icon on a blue gradient background.
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ size = 14, style, disabled = false }) => {
    const { showBadgeInfo } = useBadgeInfoStore();
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !disabled && showBadgeInfo('verification')}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    shadowColor: '#3b82f6',
                },
                style,
            ]}
        >
            <LinearGradient
                colors={['#60a5fa', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { borderRadius: size / 2 }]}
            >
                <Check
                    size={size * 0.62}
                    color="#fff"
                    strokeWidth={3}
                />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.45,
        shadowRadius: 3,
        elevation: 3,
    },
    gradient: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

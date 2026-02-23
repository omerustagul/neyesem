import { AnimatePresence, MotiView } from 'moti';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface XPNotification {
    id: string;
    amount: number;
    message: string;
}

interface XPContextType {
    showXP: (amount: number, message?: string) => void;
    showLevelUp: (newLevel: number, levelName: string) => void;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [xpQueue, setXpQueue] = useState<XPNotification[]>([]);
    const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);

    const showXP = useCallback((amount: number, message: string = 'XP KAZANDINIZ') => {
        const id = Math.random().toString(36).substr(2, 9);
        setXpQueue(prev => [...prev, { id, amount, message }]);

        setTimeout(() => {
            setXpQueue(prev => prev.filter(item => item.id !== id));
        }, 3000);
    }, []);

    const showLevelUp = useCallback((level: number, name: string) => {
        setLevelUp({ level, name });
        setTimeout(() => setLevelUp(null), 5000);
    }, []);

    return (
        <XPContext.Provider value={{ showXP, showLevelUp }}>
            {children}

            {/* XP Toast Notifications */}
            <View style={styles.xpContainer} pointerEvents="none">
                <AnimatePresence>
                    {xpQueue.map((xp) => (
                        <MotiView
                            key={xp.id}
                            from={{ opacity: 0, translateY: -20, scale: 0.8 }}
                            animate={{ opacity: 1, translateY: 0, scale: 1 }}
                            exit={{ opacity: 0, translateY: -50, scale: 1.1 }}
                            transition={{ type: 'spring', damping: 15 }}
                            style={styles.xpToast}
                        >
                            <View style={styles.xpBadge}>
                                <Text style={styles.xpAmount}>+{xp.amount}</Text>
                            </View>
                            <Text style={styles.xpText}>{xp.message.toUpperCase()}</Text>
                        </MotiView>
                    ))}
                </AnimatePresence>
            </View>

            {/* Level Up Celebration Fullscreen */}
            <AnimatePresence>
                {levelUp && (
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={styles.levelUpOverlay}
                    >
                        <MotiView
                            from={{ scale: 0.5, rotate: '0deg' }}
                            animate={{ scale: 1, rotate: '360deg' }}
                            transition={{ type: 'spring', damping: 12 }}
                            style={styles.levelUpCircle}
                        >
                            <Text style={styles.levelUpLabel}>YENİ SEVİYE!</Text>
                            <Text style={styles.levelValue}>{levelUp.level}</Text>
                            <Text style={styles.levelName}>{levelUp.name}</Text>
                        </MotiView>
                    </MotiView>
                )}
            </AnimatePresence>
        </XPContext.Provider>
    );
};

export const useXP = () => {
    const context = useContext(XPContext);
    if (!context) throw new Error('useXP must be used within XPProvider');
    return context;
};

const styles = StyleSheet.create({
    xpContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    xpToast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(13, 120, 68, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    xpBadge: {
        backgroundColor: colors.saffron,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 14,
        marginRight: 10,
    },
    xpAmount: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
    xpText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    levelUpOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8, 14, 11, 0.85)',
        zIndex: 10000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelUpCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: colors.saffron,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: '#fff',
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 20,
    },
    levelUpLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 10,
    },
    levelValue: {
        color: '#fff',
        fontSize: 100,
        fontWeight: '900',
        lineHeight: 100,
    },
    levelName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
    }
});

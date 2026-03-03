import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
    useSharedValue
} from 'react-native-reanimated';
import { GlobalHeader } from '../components/common/GlobalHeader';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ListsScreen } from '../screens/lists/ListsScreen';
import { PantryScreen } from '../screens/pantry/PantryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useNavigationStore } from '../store/navigationStore';
import { useTheme } from '../theme/ThemeProvider';
import { FloatingTabBar } from './FloatingTabBar';
import PagerView from './PagerViewWrapper';

const { width } = Dimensions.get('window');

// Map of route names to pager indices
const ROUTE_MAP: Record<string, number> = {
    'Feed': 0,
    'Explore': 1,
    'Pantry': 2,
    'Lists': 3,
    'Profile': 4
};

export const TabNavigator = () => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const scrollOffset = useSharedValue(0);
    const scrollPosition = useSharedValue(0);
    const pagerRef = useRef<PagerView>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const { setActiveTab } = useNavigationStore();

    // Simplified navigation state for 5 tabs
    const navigationState = {
        index: activeIndex,
        routes: [
            { key: 'Feed', name: 'Feed' },
            { key: 'Explore', name: 'Explore' },
            { key: 'Pantry', name: 'Pantry' },
            { key: 'Lists', name: 'Lists' },
            { key: 'Profile', name: 'Profile' }
        ]
    };

    const onPageSelected = (e: any) => {
        const index = e.nativeEvent.position;
        setActiveIndex(index);

        // Update global navigation store
        const routeName = (Object.keys(ROUTE_MAP) as ('Feed' | 'Explore' | 'Pantry' | 'Lists' | 'Profile')[])
            .find(key => ROUTE_MAP[key] === index);
        if (routeName) setActiveTab(routeName);
    };

    const onPageScroll = (e: any) => {
        scrollPosition.value = e.nativeEvent.position;
        scrollOffset.value = e.nativeEvent.offset;
    };

    // Mimic the navigation object passed to FloatingTabBar
    const navigationProxy = {
        navigate: (name: string) => {
            const targetIndex = ROUTE_MAP[name];
            if (targetIndex !== undefined) {
                pagerRef.current?.setPage(targetIndex);
                setActiveIndex(targetIndex);
            }
        },
        emit: ({ type }: any) => {
            return { defaultPrevented: false };
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GlobalHeader />
            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={onPageSelected}
                onPageScroll={onPageScroll}
                orientation="horizontal"
            >
                <View key="0" style={styles.page}>
                    <FeedScreen />
                </View>
                <View key="1" style={styles.page}>
                    <ExploreScreen />
                </View>
                <View key="2" style={styles.page}>
                    <PantryScreen />
                </View>
                <View key="3" style={styles.page}>
                    <ListsScreen />
                </View>
                <View key="4" style={styles.page}>
                    <ProfileScreen />
                </View>
            </PagerView>

            <FloatingTabBar
                state={navigationState as any}
                navigation={navigationProxy as any}
                descriptors={{} as any}
                scrollPosition={scrollPosition}
                scrollOffset={scrollOffset}
                insets={{} as any}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
    }
});

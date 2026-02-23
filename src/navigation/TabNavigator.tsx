import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet } from 'react-native';
import { CreateScreen } from '../screens/create/CreateScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ListsScreen } from '../screens/lists/ListsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { FloatingTabBar } from './FloatingTabBar';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Tab.Screen name="Feed" component={FeedScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Create" component={CreateScreen} />
            <Tab.Screen name="Lists" component={ListsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    }
});

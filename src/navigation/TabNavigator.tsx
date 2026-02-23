import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ListsScreen } from '../screens/lists/ListsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';
import { FloatingTabBar } from './FloatingTabBar';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Feed" component={FeedScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen
                name="CreatePlaceholder"
                component={View}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('Create');
                    },
                })}
            />
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

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { db } from '../api/firebase';
import { AppNotification } from '../components/common/AppNotification';
import { useNotification } from '../context/NotificationContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CreateScreen } from '../screens/create/CreateScreen';
import { CreateStoryScreen } from '../screens/create/CreateStoryScreen';
import { EditPostScreen } from '../screens/create/EditPostScreen';
import { ReelsScreen } from '../screens/feed/ReelsScreen';
import { FoodDetailScreen } from '../screens/food/FoodDetailScreen';
import { ListDetailScreen } from '../screens/lists/ListDetailScreen';
import { NotificationScreen } from '../screens/notification/NotificationScreen';
import { IntroScreen } from '../screens/onboarding/IntroScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { PublicProfileScreen } from '../screens/profile/PublicProfileScreen';
import { ActivitiesScreen } from '../screens/settings/ActivitiesScreen';
import { AppearanceScreen } from '../screens/settings/AppearanceScreen';
import { ArchiveScreen } from '../screens/settings/ArchiveScreen';
import { PasswordSecurityScreen } from '../screens/settings/PasswordSecurityScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { user, isLoading } = useAuthStore();
    const { setupListener } = useNotificationStore();
    const { theme } = useTheme();
    const [isIntroSeen, setIsIntroSeen] = useState<boolean | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let profileUnsubscribe: (() => void) | undefined;

        const checkIntroSeen = async () => {
            if (user) {
                try {
                    // Set up real-time listener for profile changes
                    profileUnsubscribe = onSnapshot(
                        doc(db, 'profiles', user.uid),
                        (docSnap) => {
                            if (docSnap.exists()) {
                                setIsIntroSeen(docSnap.data().intro_seen === true);
                            } else {
                                setIsIntroSeen(false);
                            }
                        },
                        (error: any) => {
                            console.warn("Error listening to profile:", error?.message);
                            setIsIntroSeen(false);
                        }
                    );
                } catch (error: any) {
                    console.warn("Error setting up profile listener:", error?.message);
                    setIsIntroSeen(false);
                }
            } else {
                setIsIntroSeen(null);
            }
        };

        if (user) {
            checkIntroSeen();
            unsubscribe = setupListener(user.uid);
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, [user, setupListener]);

    const { notificationHeight } = useNotification();

    // Show loading or splash if checking intro status
    if (user && isIntroSeen === null) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.saffron} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <AppNotification />
            <MotiView
                animate={{ marginTop: notificationHeight }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                style={{ flex: 1 }}
            >
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.background }
                    }}
                >
                    {user ? (
                        !isIntroSeen ? (
                            <Stack.Screen name="Intro" component={IntroScreen} />
                        ) : (
                            <>
                                <Stack.Screen
                                    name="Main"
                                    component={TabNavigator}
                                    options={{
                                        gestureEnabled: false,
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Notifications"
                                    component={NotificationScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="EditProfile"
                                    component={EditProfileScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="PublicProfile"
                                    component={PublicProfileScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Create"
                                    component={CreateScreen}
                                    options={{
                                        presentation: 'fullScreenModal',
                                        animation: 'slide_from_bottom',
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Settings"
                                    component={SettingsScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="CreateStory"
                                    component={CreateStoryScreen}
                                    options={{
                                        presentation: 'fullScreenModal',
                                        animation: 'slide_from_bottom',
                                        headerShown: false
                                    }}
                                />
                                <Stack.Screen
                                    name="ListDetail"
                                    component={ListDetailScreen}
                                    options={{
                                        headerShown: false,
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Appearance"
                                    component={AppearanceScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Archive"
                                    component={ArchiveScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="EditPost"
                                    component={EditPostScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="Reels"
                                    component={ReelsScreen}
                                    options={{
                                        animation: 'slide_from_right',
                                        gestureEnabled: true,
                                        gestureDirection: 'horizontal',
                                    }}
                                />
                                <Stack.Screen
                                    name="FoodDetail"
                                    component={FoodDetailScreen}
                                />
                                <Stack.Screen
                                    name="Activities"
                                    component={ActivitiesScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                                <Stack.Screen
                                    name="PasswordSecurity"
                                    component={PasswordSecurityScreen}
                                    options={{
                                        contentStyle: { backgroundColor: theme.background }
                                    }}
                                />
                            </>
                        )
                    ) : (
                        <>
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="Register" component={RegisterScreen} />
                        </>
                    )}
                </Stack.Navigator>
            </MotiView>
        </View>
    );
};

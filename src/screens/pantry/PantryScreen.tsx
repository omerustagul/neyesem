import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ScanLine, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pantryService, UserPantry } from '../../api/pantryService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export const PantryScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;
    const { user } = useAuthStore();
    const isFocused = useIsFocused();
    const [pantry, setPantry] = useState<UserPantry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [newIngredient, setNewIngredient] = useState('');
    const [showAddManual, setShowAddManual] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);


    useEffect(() => {
        if (!user) return;
        const unsubscribe = pantryService.subscribeToPantry(user.uid, (data) => {
            setPantry(data);
            setIsLoading(false);

            // Fetch suggestions when pantry updates
            if (data && data.ingredients.length > 0) {
                fetchSuggestions(data.ingredients.map(i => i.name));
            } else {
                setSuggestions([]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const fetchSuggestions = async (ingredients: string[]) => {
        setIsFetchingSuggestions(true);
        const matches = await pantryService.findMatchingRecipes(ingredients);
        setSuggestions(matches);
        setIsFetchingSuggestions(false);
    };

    const handleAddManual = async () => {
        if (!newIngredient.trim() || !user) return;
        await pantryService.addIngredient(user.uid, newIngredient.trim());
        setNewIngredient('');
        setShowAddManual(false);
    };

    const handleCameraScan = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && user) {
            setIsScanning(true);
            // Simulate AI analysis for now
            setTimeout(async () => {
                const mockIngredients = ['Domates', 'Patates', 'Soğan'];
                for (const item of mockIngredients) {
                    await pantryService.addIngredient(user.uid, item);
                }
                setIsScanning(false);
                // fetchSuggestions will be triggered by useEffect
            }, 3000);
        }
    };

    const renderIngredient = ({ item }: { item: any }) => (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={[styles.ingredientCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: theme.border }]}
        >
            <Text style={[styles.ingredientName, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>
            <TouchableOpacity
                onPress={() => user && pantryService.removeIngredient(user.uid, item)}
                style={styles.deleteBtn}
            >
                <Trash2 size={16} color={colors.spiceRed} />
            </TouchableOpacity>
        </MotiView>
    );

    const renderSuggestion = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => navigation.navigate('FoodDetail', { post: item })}
        >
            <ExpoImage
                source={{ uri: item.thumbnail_url || item.content_url }}
                style={styles.suggestionImage}
                contentFit="cover"
            />
            <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>%{item.matchScore} Eşleşme</Text>
            </View>
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.suggestionGradient}
            >
                <Text style={styles.suggestionTitle} numberOfLines={1}>{item.caption}</Text>
                <View style={styles.missingInfo}>
                    {item.missingCount > 0 ? (
                        <Text style={styles.missingText}>
                            -{item.missingCount} malzeme eksik ({item.missingIngredients.join(', ')})
                        </Text>
                    ) : (
                        <Text style={[styles.missingText, { color: colors.mintFresh }]}>Tüm malzemeler var!</Text>
                    )}
                </View>
                <Text style={styles.suggestionUser}>@{item.username}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                ListHeaderComponent={
                    <>
                        {/* Header / Hero */}
                        <View style={[styles.heroSection, { paddingTop: headerHeight + 16 }]}>
                            <MotiView
                                from={{ translateY: -20, opacity: 0 }}
                                animate={{ translateY: 0, opacity: 1 }}
                            >
                                <Text style={[styles.heroTitle, { color: theme.text, fontFamily: typography.display }]}>
                                    Mutfak DNA'n
                                </Text>
                                <Text style={[styles.heroSub, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Elindeki malzemeleri tara, sana özel tarifleri bulalım.
                                </Text>
                            </MotiView>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.scanBtn, { backgroundColor: colors.saffron }]}
                                    onPress={handleCameraScan}
                                    activeOpacity={0.8}
                                >
                                    <ScanLine color="#fff" size={20} />
                                    <Text style={styles.scanBtnText}>Buzdolabını Tara</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                    onPress={() => setShowAddManual(!showAddManual)}
                                >
                                    <Plus color={theme.text} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Manual Input Area */}
                        <AnimatePresence>
                            {showAddManual && (
                                <MotiView
                                    from={{ height: 0, opacity: 0 }}
                                    animate={{ height: 50, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={styles.manualInputContainer}
                                >
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                        placeholder="Örn: Zeytinyağı"
                                        placeholderTextColor={theme.secondaryText}
                                        value={newIngredient}
                                        onChangeText={setNewIngredient}
                                    />
                                    <TouchableOpacity style={styles.inputAddBtn} onPress={handleAddManual}>
                                        <Text style={styles.inputAddBtnText}>Ekle</Text>
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </AnimatePresence>

                        {/* Ingredients Grid Label */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Mutfaktaki Malzemeler
                            </Text>
                        </View>
                    </>
                }
                data={pantry?.ingredients || []}
                renderItem={renderIngredient}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.center}>
                            <UtensilsCrossed size={48} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Mutfağın henüz boş.</Text>
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.saffron} />
                        </View>
                    )
                }
                ListFooterComponent={
                    <>
                        {suggestions.length > 0 && (
                            <View style={styles.suggestionsSection}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        Sana Özel Öneriler
                                    </Text>
                                </View>
                                <FlatList
                                    horizontal
                                    data={suggestions}
                                    renderItem={renderSuggestion}
                                    keyExtractor={(item) => item.id}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.suggestionsList}
                                />
                            </View>
                        )}
                        <View style={{ height: 100 }} />
                    </>
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Scanning Overlay */}
            {isScanning && (
                <View style={[StyleSheet.absoluteFill, styles.scanOverlay]}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <ActivityIndicator size="large" color={colors.saffron} />
                    <MotiView
                        from={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ loop: true, type: 'timing', duration: 1500 }}
                        style={styles.scanCircle}
                    />
                    <Text style={styles.scanStatusText}>AI Malzemeleri Tanımlıyor...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroSection: {
        padding: 24,
        paddingTop: 60,
    },
    heroTitle: {
        fontSize: 32,
        marginBottom: 8,
    },
    heroSub: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    scanBtn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    scanBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addBtn: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    manualInputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 10,
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    inputAddBtn: {
        backgroundColor: colors.mintFresh,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 12,
    },
    inputAddBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    ingredientCard: {
        flex: 1,
        margin: 6,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ingredientName: {
        fontSize: 14,
    },
    deleteBtn: {
        padding: 4,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    scanOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 100,
    },
    scanCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.saffron,
        position: 'absolute',
    },
    scanStatusText: {
        color: '#fff',
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    suggestionsSection: {
        marginTop: 20,
    },
    suggestionsList: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    suggestionItem: {
        width: 220,
        height: 280,
        borderRadius: 24,
        marginHorizontal: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    suggestionImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    scoreBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.saffron,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    suggestionGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    suggestionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    suggestionUser: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    missingInfo: {
        marginBottom: 8,
    },
    missingText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontStyle: 'italic',
    },
});

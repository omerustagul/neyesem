import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ScanLine, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react-native';
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

            // Fetch AI suggestions when pantry updates
            if (data && data.ingredients.length > 0) {
                generateChefSuggestions(data.ingredients.map(i => i.name));
            } else {
                setSuggestions([]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const generateChefSuggestions = async (ingredients: string[]) => {
        if (!ingredients.length) {
            setSuggestions([]);
            return;
        }

        setIsFetchingSuggestions(true);
        const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            setIsFetchingSuggestions(false);
            return;
        }

        try {
            const prompt = `Şu malzemelere sahibim: ${ingredients.join(', ')}. Bana bu malzemeleri kullanarak yapabileceğim 2 farklı modern, yaratıcı ve lezzetli yemek tarifi öner. Yanıtını kesinlikle aşağıdaki JSON formatında, bir dizi (array) olarak ver:\n` +
                `[\n  {\n    "id": "benzersiz-id",\n    "title": "Tarif Adı",\n    "description": "Kısa ve iştah açıcı tek cümlelik açıklama",\n    "hashtags": ["#saglikli", "#pratik"]\n  }\n]\nSadece JSON döndür, markdown veya başka metin ekleme.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                })
            });

            const result = await response.json();
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const text = result.candidates[0].content.parts[0].text.trim();
                const recipes = JSON.parse(text);
                setSuggestions(recipes);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error generating AI recipes:', error);
            setSuggestions([]);
        } finally {
            setIsFetchingSuggestions(false);
        }
    };

    const handleAddManual = async () => {
        if (!newIngredient.trim() || !user) return;
        await pantryService.addIngredient(user.uid, newIngredient.trim());
        setNewIngredient('');
        setShowAddManual(false);
    };

    const analyzeImageWithGemini = async (base64Image: string, mimeType: string = 'image/jpeg') => {
        const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            Alert.alert('API Anahtarı Eksik', "Yapay zeka analizini kullanmak için EXPO_PUBLIC_GEMINI_API_KEY ortam değişkeni ayarlanmalıdır. (Örn: .env dosyasında)");
            return null;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Lütfen bu fotoğraftaki yiyecekleri, meyveleri, sebzeleri, atıştırmalıkları (örneğin: mandalina, galeta, elma, et vb.) ve yemek malzemelerini detaylıca analiz et. Gördüğün her türlü yiyecek öğesini Türkçe olarak SADECE virgülle ayırarak SADECE isimleri ile listele. Eğer hiçbir yiyecek veya malzeme yoksa 'YOK' yaz. Yanıtın sadece virgül ve kelimelerden oluşmalı, başka hiçbir açıklama veya ek kelime kullanma." },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                })
            });

            const result = await response.json();
            console.log('Gemini Full Response:', JSON.stringify(result, null, 2));

            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const text = result.candidates[0].content.parts[0].text.trim();
                console.log('Gemini Parsed Text:', text);
                const cleanText = text.replace(/[\n\r.]/g, '');
                if (cleanText.toUpperCase() === 'YOK' || cleanText === '') {
                    return [];
                }
                return cleanText.split(',').map((item: string) => item.trim());
            } else if (result.error) {
                console.error('Gemini API returned error object:', result.error);
            }
            return [];
        } catch (error) {
            console.error('Gemini API Error:', error);
            Alert.alert('Hata', 'Görüntü analiz edilirken bir hata oluştu.');
            return null;
        }
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
            base64: true,
        });

        if (!result.canceled && user && result.assets && result.assets.length > 0) {
            const base64Img = result.assets[0].base64;
            let mimeType = result.assets[0].mimeType;
            if (!mimeType) {
                // Determine format
                mimeType = result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
            }
            if (!base64Img) return;

            setIsScanning(true);

            const ingredients = await analyzeImageWithGemini(base64Img, mimeType);

            if (ingredients && ingredients.length > 0) {
                let addedCount = 0;
                for (const item of ingredients) {
                    if (item) {
                        await pantryService.addIngredient(user.uid, item);
                        addedCount++;
                    }
                }
                Alert.alert('Başarılı', `${addedCount} yiyecek buzdolabına eklendi:\n${ingredients.join(', ')}`);
            } else if (ingredients && ingredients.length === 0) {
                Alert.alert('Sonuç', 'Fotoğraf analiz edildi, yiyecek bulunamadı.');
            }

            setIsScanning(false);
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

    const renderChefSuggestion = ({ item, index }: { item: any, index: number }) => (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 150 }}
        >
            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#0D0D0D'] : ['#FFF', '#F5F5F5']}
                style={[styles.aiRecipeCard, { borderColor: theme.border, borderWidth: 1 }]}
            >
                <View style={styles.aiRecipeHeader}>
                    <Text style={[styles.aiRecipeTitle, { color: theme.text, fontFamily: typography.display }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.aiBadge}>
                        <Sparkles size={12} color="#fff" />
                        <Text style={styles.aiBadgeText}>AI Şef</Text>
                    </View>
                </View>

                <Text style={[styles.aiRecipeDescription, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {item.description}
                </Text>

                <View style={styles.hashtagRow}>
                    {item.hashtags?.map((tag: string, idx: number) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.hashtagChip, { backgroundColor: isDark ? 'rgba(255,178,0,0.15)' : 'rgba(255,178,0,0.1)' }]}
                            onPress={() => navigation.navigate('Explore', { searchQuery: tag })}
                        >
                            <Text style={[styles.hashtagText, { color: colors.saffron, fontFamily: typography.body }]}>
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>
        </MotiView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                contentContainerStyle={styles.flatListContent}
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
                        {(suggestions.length > 0 || isFetchingSuggestions) && (
                            <View style={styles.suggestionsSection}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            Yapay Zeka Tarif Önerisi
                                        </Text>
                                        <Sparkles size={16} color={colors.saffron} />
                                    </View>
                                </View>
                                {isFetchingSuggestions ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator color={colors.saffron} />
                                        <Text style={{ marginTop: 10, color: theme.secondaryText, fontFamily: typography.body }}>
                                            AI Şef tarifleri düşünüyor...
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.aiRecipeContainer}>
                                        {suggestions.map((item, index) => (
                                            <React.Fragment key={index}>
                                                {renderChefSuggestion({ item, index })}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                )}
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
        paddingVertical: 24,
        paddingHorizontal: 0,
    },
    flatListContent: {
        paddingHorizontal: 18,
    },
    heroTitle: {
        fontSize: 26,
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
        paddingHorizontal: 0,
        gap: 12,
        marginBottom: 10,
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    inputAddBtn: {
        backgroundColor: colors.mintFresh,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 16,
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
        margin: 4,
        padding: 16,
        borderRadius: 20,
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
        paddingHorizontal: 0,
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
    aiRecipeContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    aiRecipeCard: {
        padding: 16,
        borderRadius: 20,
    },
    aiRecipeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    aiRecipeTitle: {
        fontSize: 18,
        flex: 1,
        marginRight: 10,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.saffron,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    aiBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    aiRecipeDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    hashtagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hashtagChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    hashtagText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

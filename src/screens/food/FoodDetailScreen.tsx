import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowLeft, ChefHat, Clock, Gauge, Play, Utensils } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post, subscribeToFeedPosts } from '../../api/postService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const NutritionCard = ({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: any;
    label: string;
    value: string;
    color: string;
}) => {
    const { theme, typography, isDark } = useTheme();
    return (
        <View style={[nutrStyles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
            <View style={[nutrStyles.icon, { backgroundColor: color + '22' }]}>
                <Icon size={18} color={color} />
            </View>
            <Text style={[nutrStyles.value, { color: theme.text, fontFamily: typography.bodyMedium }]}>{value}</Text>
            <Text style={[nutrStyles.label, { color: theme.secondaryText, fontFamily: typography.body }]}>{label}</Text>
        </View>
    );
};

const nutrStyles = StyleSheet.create({
    card: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
        minWidth: (width - 52) / 4,
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    value: {
        fontSize: 13,
        textAlign: 'center',
    },
    label: {
        fontSize: 10,
        textAlign: 'center',
    },
});

const RelatedVideoItem = ({ item, navigation }: { item: Post; navigation: any }) => {
    const player = useVideoPlayer(item.content_url || '', (p: any) => {
        p.pause();
    });

    return (
        <TouchableOpacity
            style={styles.videoItem}
            onPress={() => navigation.navigate('Reels', { initialPostId: item.id })}
        >
            {item.content_url && (item.content_type === 'video' || item.content_type === 'embed') ? (
                <VideoView player={player} style={styles.gridVideo} contentFit="cover" nativeControls={false} />
            ) : item.content_url && item.content_type === 'image' ? (
                <ExpoImage source={{ uri: item.content_url }} style={styles.gridVideo} contentFit="cover" />
            ) : (
                <View style={[styles.gridVideo, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                    <Play size={24} color="#fff" />
                </View>
            )}
            <View style={styles.videoOverlay}>
                <Text style={styles.videoUser} numberOfLines={1}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const FoodDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { theme, typography, isDark } = useTheme();
    const { post } = route.params as { post: Post };

    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToFeedPosts((fetchedPosts) => {
            const videos = fetchedPosts.filter(
                (p) => p.id !== post.id && (p.content_type === 'video' || p.content_type === 'embed')
            );
            setRelatedPosts(videos.slice(0, 9));
        });
        return () => unsubscribe();
    }, [post.id]);

    const hasNutrition = !!(post.cooking_time || post.prep_time || post.servings || post.difficulty || post.calories || post.protein || post.carbs || post.fat || post.fiber);
    const hasIngredients = !!(post.ingredients && post.ingredients.length > 0);
    const hasRecipeSteps = !!(post.recipe_steps && post.recipe_steps.length > 0);
    const hasAllergens = !!(post.allergens && post.allergens.length > 0);
    const hasTips = !!(post.tips && post.tips.length > 0);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                    Yemek Hakkında
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Post media preview */}
                {!!post.content_url && post.content_type === 'image' && (
                    <View style={styles.heroContainer}>
                        <ExpoImage source={{ uri: post.content_url }} style={styles.heroImage} contentFit="cover" />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.heroLabel}>
                            <Text style={[styles.heroUsername, { fontFamily: typography.bodyMedium }]}>
                                @{post.username}'in Tarifi
                            </Text>
                        </View>
                    </View>
                )}

                {/* Caption */}
                {!!post.caption && (
                    <View style={styles.section}>
                        <Text style={[styles.caption, { color: theme.text, fontFamily: typography.body }]}>
                            {post.caption}
                        </Text>
                    </View>
                )}

                {/* Nutrition Info */}
                {hasNutrition && (
                    <View style={[styles.section, styles.sectionNoBorder]}>
                        <View style={styles.sectionTitleRow}>
                            <ChefHat size={16} color={colors.saffron} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Tarif Bilgileri
                            </Text>
                        </View>
                        <View style={styles.nutritionGrid}>
                            {!!post.prep_time && (
                                <NutritionCard icon={Clock} label="Hazırlık" value={post.prep_time} color={colors.mintFresh} />
                            )}
                            {!!post.cooking_time && (
                                <NutritionCard icon={Zap} label="Pişirme" value={post.cooking_time} color={colors.saffron} />
                            )}
                            {!!post.servings && (
                                <NutritionCard icon={Utensils} label="Porsiyon" value={post.servings} color={colors.oliveLight} />
                            )}
                            {!!post.difficulty && (
                                <NutritionCard icon={Gauge} label="Zorluk" value={post.difficulty} color={colors.mintFresh} />
                            )}
                        </View>

                        {/* Nutrition Values */}
                        {(post.calories || post.protein || post.carbs || post.fat || post.fiber) && (
                            <View style={[styles.nutritionValuesContainer, { borderTopColor: theme.border }]}>
                                <Text style={[styles.nutritionValuesTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                    Besin Değerleri (100g başına)
                                </Text>
                                <View style={styles.nutritionValuesGrid}>
                                    {!!post.calories && (
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionValueLabel, { color: theme.secondaryText }]}>Kalori</Text>
                                            <Text style={[styles.nutritionValueText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {post.calories} kcal
                                            </Text>
                                        </View>
                                    )}
                                    {!!post.protein && (
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionValueLabel, { color: theme.secondaryText }]}>Protein</Text>
                                            <Text style={[styles.nutritionValueText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {post.protein}
                                            </Text>
                                        </View>
                                    )}
                                    {!!post.carbs && (
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionValueLabel, { color: theme.secondaryText }]}>Karbohidrat</Text>
                                            <Text style={[styles.nutritionValueText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {post.carbs}
                                            </Text>
                                        </View>
                                    )}
                                    {!!post.fat && (
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionValueLabel, { color: theme.secondaryText }]}>Yağ</Text>
                                            <Text style={[styles.nutritionValueText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {post.fat}
                                            </Text>
                                        </View>
                                    )}
                                    {!!post.fiber && (
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionValueLabel, { color: theme.secondaryText }]}>Lif</Text>
                                            <Text style={[styles.nutritionValueText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {post.fiber}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Ingredients */}
                {hasIngredients && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Utensils size={16} color={colors.mintFresh} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Malzemeler
                            </Text>
                        </View>
                        <View style={styles.ingredientGrid}>
                            {post.ingredients!.map((ingredient, i) => (
                                <BlurView
                                    key={i}
                                    intensity={isDark ? 20 : 10}
                                    tint={isDark ? 'dark' : 'light'}
                                    style={[styles.ingredientChip, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                                >
                                    <Text style={[styles.ingredientText, { color: theme.text, fontFamily: typography.body }]}>
                                        {ingredient}
                                    </Text>
                                </BlurView>
                            ))}
                        </View>
                    </View>
                )}

                {/* Recipe Steps */}
                {hasRecipeSteps && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Play size={16} color={colors.spiceRed} fill={colors.spiceRed} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Tarif Adımları
                            </Text>
                        </View>
                        {post.recipe_steps!.map((step, i) => (
                            <View key={i} style={[styles.stepRow, { borderColor: theme.border }]}>
                                <View style={[styles.stepNumber, { backgroundColor: colors.saffron }]}>
                                    <Text style={[styles.stepNumText, { fontFamily: typography.bodyMedium }]}>{i + 1}</Text>
                                </View>
                                <Text style={[styles.stepText, { color: theme.text, fontFamily: typography.body }]}>
                                    {step}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Tips */}
                {hasTips && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Leaf size={16} color={colors.oliveLight} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                İpuçları
                            </Text>
                        </View>
                        {post.tips!.map((tip, i) => (
                            <View key={i} style={[styles.tipRow, { backgroundColor: isDark ? 'rgba(255,178,0,0.08)' : 'rgba(255,178,0,0.05)', borderColor: isDark ? 'rgba(255,178,0,0.15)' : 'rgba(255,178,0,0.1)' }]}>
                                <Text style={[styles.tipText, { color: theme.text, fontFamily: typography.body }]}>
                                    {tip}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Allergens */}
                {hasAllergens && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <AlertCircle size={16} color={colors.spiceRed} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Alerjen Uyarısı
                            </Text>
                        </View>
                        <View style={styles.allergenGrid}>
                            {post.allergens!.map((allergen, i) => (
                                <BlurView
                                    key={i}
                                    intensity={isDark ? 20 : 10}
                                    tint={isDark ? 'dark' : 'light'}
                                    style={[styles.allergenChip, { borderColor: colors.spiceRed + '40' }]}
                                >
                                    <AlertCircle size={12} color={colors.spiceRed} />
                                    <Text style={[styles.allergenText, { color: colors.spiceRed, fontFamily: typography.body }]}>
                                        {allergen}
                                    </Text>
                                </BlurView>
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty state when no recipe data */}
                {!hasIngredients && !hasRecipeSteps && !hasAllergens && !hasTips && (
                    <View style={[styles.emptyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                        <ChefHat size={36} color={theme.secondaryText} />
                        <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Bu gönderi için tarif detayı bulunmuyor.
                        </Text>
                    </View>
                )}

                {/* Related Videos */}
                {relatedPosts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Play size={16} color={theme.secondaryText} fill={theme.secondaryText} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                İlgili Videolar
                            </Text>
                        </View>
                        <FlatList
                            data={relatedPosts}
                            renderItem={({ item }) => <RelatedVideoItem item={item} navigation={navigation} />}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            scrollEnabled={false}
                            contentContainerStyle={styles.gridContainer}
                        />
                    </View>
                )}

                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 0.5,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
    },
    scrollContent: {
        paddingTop: 8,
    },
    heroContainer: {
        width,
        height: width * 0.55,
        marginBottom: 4,
        position: 'relative',
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroLabel: {
        position: 'absolute',
        bottom: 14,
        left: 16,
    },
    heroUsername: {
        color: '#fff',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.07)',
    },
    sectionNoBorder: {
        borderBottomWidth: 0,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
    },
    caption: {
        fontSize: 15,
        lineHeight: 22,
    },
    nutritionGrid: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    ingredientGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    ingredientText: {
        fontSize: 13,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    stepNumText: {
        color: '#fff',
        fontSize: 13,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
    },
    tipRow: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        lineHeight: 20,
    },
    allergenGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    allergenChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    allergenText: {
        fontSize: 12,
    },
    nutritionValuesContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 0.5,
    },
    nutritionValuesTitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    nutritionValuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    nutritionValue: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
    },
    nutritionValueLabel: {
        fontSize: 11,
        marginBottom: 4,
    },
    nutritionValueText: {
        fontSize: 13,
    },
    emptyCard: {
        margin: 16,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    gridContainer: {
        paddingHorizontal: 0,
    },
    videoItem: {
        width: width / 3 - 4,
        height: (width / 3 - 4) * 1.5,
        margin: 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    gridVideo: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoUser: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});

import { Globe } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { CUISINE_CATALOGUE } from '../../constants/cuisines';
import { useTheme } from '../../theme/ThemeProvider';
import CuisineCard from './CuisineCard';
import CuisineFeedList from './CuisineFeedList';

export default function CuisineSection() {
    const { theme, typography } = useTheme();
    const [selectedCuisineId, setSelectedCuisineId] = useState<string | null>(null);

    const handleCuisineSelect = (id: string) => {
        setSelectedCuisineId(selectedCuisineId === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                        <Globe size={18} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>
                            Mutfakları Keşfet
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Dünya mutfaklarından en özel tarifler
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={CUISINE_CATALOGUE}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <CuisineCard
                        cuisine={item}
                        isSelected={selectedCuisineId === item.id}
                        onPress={() => handleCuisineSelect(item.id)}
                    />
                )}
            />

            {selectedCuisineId && (
                <CuisineFeedList cuisineId={selectedCuisineId} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        paddingHorizontal: 2,
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 13,
    },
    list: {
        paddingHorizontal: 2,
        paddingBottom: 4,
    },
});


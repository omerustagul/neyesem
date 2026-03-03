import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MOOD_MODES } from '../../constants/moodModes';
import { useDynamicMoodSuggestion } from '../../hooks/useDynamicMoodSuggestion';
import { useMoodLogger } from '../../hooks/useMoodLogger';
import { useTheme } from '../../theme/ThemeProvider';
import DynamicMoodBanner from './DynamicMoodBanner';
import MoodFeedList from './MoodFeedList';
import MoodModeCard from './MoodModeCard';

export default function MoodModesSection() {
    const { theme, typography } = useTheme();
    const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
    const suggestedMood = useDynamicMoodSuggestion();
    const { logMoodSelection } = useMoodLogger();

    const handleMoodSelect = (moodId: string) => {
        const newSelection = selectedMoodId === moodId ? null : moodId;
        setSelectedMoodId(newSelection);
        if (newSelection) logMoodSelection(newSelection);
    };

    return (
        <View style={styles.container}>
            {/* Bölüm Başlığı */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                        <Sparkles size={18} color="#f43f5e" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>
                            Ruh Haline Göre
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Anına uygun tarifleri keşfet
                        </Text>
                    </View>
                </View>
            </View>

            {/* Otomatik Mod Önerisi Banner */}
            {suggestedMood && !selectedMoodId && (
                <DynamicMoodBanner
                    mode={suggestedMood}
                    onPress={() => handleMoodSelect(suggestedMood.id)}
                />
            )}

            {/* Mod Kartları — Yatay Scroll */}
            <FlatList
                data={MOOD_MODES}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moodList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MoodModeCard
                        mode={item}
                        isSelected={selectedMoodId === item.id}
                        onPress={() => handleMoodSelect(item.id)}
                    />
                )}
            />

            {/* Seçili Mod İçerik Listesi */}
            {selectedMoodId && (
                <MoodFeedList moodId={selectedMoodId} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 13,
    },
    moodList: {
        paddingHorizontal: 16,
        paddingBottom: 4,
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
});


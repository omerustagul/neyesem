import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Bookmark, Check, Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { UserList, createList, getListsContainingPost, subscribeToUserLists, togglePostInList } from '../../api/listService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface SavePopupProps {
    postId: string;
    onClose: () => void;
}

export const SavePopup: React.FC<SavePopupProps> = ({ postId, onClose }) => {
    const { theme, typography, isDark } = useTheme();
    const { user } = useAuthStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['60%', '80%'], []);

    const [lists, setLists] = useState<UserList[]>([]);
    const [savedListIds, setSavedListIds] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToUserLists(user.uid, (fetchedLists) => {
            setLists(fetchedLists);
        });

        // Check which lists contain this post
        getListsContainingPost(user.uid, postId).then(setSavedListIds);

        return () => unsubscribe();
    }, [user, postId]);

    const handleToggleSave = async (listId: string) => {
        const isCurrentlySaved = savedListIds.includes(listId);
        try {
            await togglePostInList(listId, postId, !isCurrentlySaved);
            if (isCurrentlySaved) {
                setSavedListIds(prev => prev.filter(id => id !== listId));
            } else {
                setSavedListIds(prev => [...prev, listId]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Liste güncellenemedi.');
        }
    };

    const handleCreateList = async () => {
        if (!user || !newListTitle.trim()) return;
        try {
            const newListId = await createList(user.uid, newListTitle.trim());
            await togglePostInList(newListId, postId, true);
            setSavedListIds(prev => [...prev, newListId]);
            setNewListTitle('');
            setIsCreating(false);
            Keyboard.dismiss();
        } catch (error) {
            Alert.alert('Hata', 'Yeni liste oluşturulamadı.');
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
            />
        ),
        [onClose]
    );

    const renderItem = ({ item }: { item: UserList }) => {
        const isSaved = savedListIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[styles.listItem, { borderBottomColor: theme.border }]}
                onPress={() => handleToggleSave(item.id)}
            >
                <View style={styles.listInfo}>
                    <View style={[styles.listIcon, { backgroundColor: `${colors.saffron}15` }]}>
                        <Bookmark size={20} color={colors.saffron} />
                    </View>
                    <View>
                        <Text style={[styles.listTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.listCount, { color: theme.secondaryText }]}>
                            {item.postIds?.length || 0} içerik
                        </Text>
                    </View>
                </View>
                <View style={[styles.checkbox, {
                    borderColor: isSaved ? colors.saffron : theme.border,
                    backgroundColor: isSaved ? colors.saffron : 'transparent'
                }]}>
                    {isSaved && <Check size={14} color={colors.warmWhite} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: theme.border }}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            Listeye Kaydet
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {isCreating ? (
                        <View style={styles.createContainer}>
                            <BottomSheetTextInput
                                style={[styles.input, {
                                    color: theme.text,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    fontFamily: typography.body
                                }]}
                                placeholder="Liste adı..."
                                placeholderTextColor={theme.secondaryText}
                                value={newListTitle}
                                onChangeText={setNewListTitle}
                                autoFocus
                            />
                            <View style={styles.createActions}>
                                <TouchableOpacity
                                    onPress={() => setIsCreating(false)}
                                    style={[styles.button, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                >
                                    <Text style={{ color: theme.text }}>Vazgeç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateList}
                                    disabled={!newListTitle.trim()}
                                    style={[styles.button, { backgroundColor: colors.saffron, opacity: newListTitle.trim() ? 1 : 0.5 }]}
                                >
                                    <Text style={{ color: colors.warmWhite }}>Oluştur ve Kaydet</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.createNewButton}
                                onPress={() => setIsCreating(true)}
                            >
                                <View style={styles.plusIcon}>
                                    <Plus size={20} color={colors.saffron} />
                                </View>
                                <Text style={[styles.createNewText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>
                                    Yeni Liste Oluştur
                                </Text>
                            </TouchableOpacity>

                            <BottomSheetFlatList
                                data={lists}
                                keyExtractor={(item: UserList) => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={{ color: theme.secondaryText }}>Henüz listen yok.</Text>
                                    </View>
                                }
                            />
                        </>
                    )}
                </View>
            </BottomSheet>
        </Portal>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 16,
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    plusIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.saffron}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    createNewText: {
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    listInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listIcon: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    listTitle: {
        fontSize: 15,
    },
    listCount: {
        fontSize: 12,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createContainer: {
        padding: 20,
    },
    input: {
        height: 50,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
});

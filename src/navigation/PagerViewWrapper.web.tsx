import React, { Children, forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const PagerView = forwardRef(({ children, initialPage = 0, onPageSelected, onPageScroll, style }: any, ref) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const childrenArray = Children.toArray(children);

    useImperativeHandle(ref, () => ({
        setPage: (page: number) => {
            setCurrentPage(page);
            if (onPageSelected) {
                onPageSelected({ nativeEvent: { position: page } });
            }
        }
    }));

    // On web, we simply render the active page as there's no native "swipe" pager
    // This fixes the crash and provides a functional tab navigation
    return (
        <View style={[styles.container, style]}>
            {childrenArray[currentPage]}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default PagerView;

import React from 'react'
import { FlatList, RefreshControl, FlatListProps } from 'react-native'

type RefreshableFlatListProps<ItemT> = FlatListProps<ItemT> & {
  refreshing: boolean
  onRefresh: () => void
  tintColor?: string
  colors?: string[]
}

function RefreshableFlatList<ItemT>(props: RefreshableFlatListProps<ItemT>) {
  const { refreshing, onRefresh, tintColor, colors, ...rest } = props
  return (
    <FlatList
      {...(rest as any)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          colors={colors ?? [tintColor ?? '#ccc']}
        />
      }
    />
  )
}

export default RefreshableFlatList

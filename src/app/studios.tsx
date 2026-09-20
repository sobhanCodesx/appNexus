import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StudioCard } from '@/components/cards/studio-card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { layout, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { Paginated, StudioCard as Studio } from '@/types/api';

export default function StudiosScreen(){
 const {data,refreshing,refresh,loadMore,loadingMore}=usePaginatedResource<Studio>('/studios');
 return <Screen>
  <PageHeader title="Studios" subtitle="GAME CREATORS" onSearch={()=>router.push('/search')} />
  <FlashList data={data.data||[]} refreshing={refreshing} onRefresh={refresh}
   onEndReached={()=>void loadMore()} onEndReachedThreshold={0.45}
   ListFooterComponent={loadingMore?<View style={styles.loading}/>:null}
   contentContainerStyle={styles.content}
   renderItem={({item})=><View style={styles.card}><StudioCard item={item} onPress={()=>router.push({pathname:'/studio/[slug]',params:{slug:item.slug}})} /></View>}
  />
 </Screen>
}
const styles=StyleSheet.create({loading:{height:48},content:{paddingHorizontal:layout.screenPadding,paddingBottom:90},card:{marginBottom:spacing.md}});

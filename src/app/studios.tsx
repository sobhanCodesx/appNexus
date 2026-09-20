import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StudioCard } from '@/components/cards/studio-card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { layout, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated, StudioCard as Studio } from '@/types/api';

export default function StudiosScreen(){
 const {data,refreshing,refresh}=useApiResource<Paginated<Studio>>('/studios',{data:[]});
 return <Screen>
  <PageHeader title="Studios" subtitle="GAME CREATORS" onSearch={()=>router.push('/search')} />
  <FlashList data={data.data||[]} refreshing={refreshing} onRefresh={refresh} contentContainerStyle={styles.content}
   renderItem={({item})=><View style={styles.card}><StudioCard item={item} onPress={()=>router.push({pathname:'/studio/[slug]',params:{slug:item.slug}})} /></View>}
  />
 </Screen>
}
const styles=StyleSheet.create({content:{paddingHorizontal:layout.screenPadding,paddingBottom:90},card:{marginBottom:spacing.md}});

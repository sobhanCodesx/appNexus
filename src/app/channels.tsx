import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { Paginated } from '@/types/api';

type Channel={id:number;name:string;slug:string;developer?:string|null;cover_url?:string|null;background_url?:string|null;videos_count?:number;subscribers_count?:number;is_subscribed?:boolean};
export default function ChannelsScreen(){
 const {data,refreshing,refresh,loadMore,loadingMore}=usePaginatedResource<Channel>('/channels');
 return <Screen>
  <PageHeader title="Game Hubs" subtitle="ALL CHANNELS" onSearch={()=>router.push('/search')} />
  <FlashList data={data.data||[]} refreshing={refreshing} onRefresh={refresh}
   onEndReached={()=>void loadMore()} onEndReachedThreshold={0.45}
   ListFooterComponent={loadingMore?<View style={styles.loading}><Text style={styles.loadingText}>کانال‌های بیشتر…</Text></View>:null}
   contentContainerStyle={styles.content}
   renderItem={({item})=><PressableScale style={styles.card} onPress={()=>router.push({pathname:'/channel/[slug]',params:{slug:item.slug}})}>
    <Image source={item.background_url||item.cover_url?{uri:String(item.background_url||item.cover_url)}:require('../../assets/images/logo-glow.png')} style={styles.image} contentFit="cover" cachePolicy="memory-disk"/>
    <View style={styles.copy}><Text style={styles.kicker}>{item.developer||'GAME CHANNEL'}</Text><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{(item.subscribers_count||0).toLocaleString('fa-IR')} دنبال‌کننده · {(item.videos_count||0).toLocaleString('fa-IR')} ویدیو</Text></View>
   </PressableScale>}
  />
 </Screen>
}
const styles=StyleSheet.create({loading:{paddingVertical:spacing.lg,alignItems:'center'},loadingText:{color:palette.textDim,fontFamily:fontFamily.regular,fontSize:10},content:{paddingHorizontal:layout.screenPadding,paddingBottom:90},card:{height:210,borderRadius:radii.xl,overflow:'hidden',borderWidth:1,borderColor:palette.line,marginBottom:spacing.md,backgroundColor:palette.surface},image:{position:'absolute',top:0,right:0,bottom:0,left:0},copy:{marginTop:'auto',padding:spacing.lg,backgroundColor:'rgba(3,5,9,0.68)',alignItems:'flex-end'},kicker:{color:palette.cyan,fontFamily:fontFamily.black,fontSize:8,letterSpacing:1},name:{color:palette.white,fontFamily:fontFamily.black,fontSize:22,marginTop:3},meta:{color:palette.textMuted,fontFamily:fontFamily.regular,fontSize:10,marginTop:4}});

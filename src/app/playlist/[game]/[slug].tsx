import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentCard } from '@/components/cards/content-card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ContentCard as ContentItem } from '@/types/api';

type Payload={channel:{id:number;name:string;slug:string};playlist:{id:number;title:string;slug:string;cover_url?:string|null;description?:string|null;videos?:ContentItem[]}};
const empty:Payload={channel:{id:0,name:'',slug:''},playlist:{id:0,title:'',slug:'',videos:[]}};

export default function PlaylistScreen(){
 const params=useLocalSearchParams<{game:string;slug:string}>();
 const game=Array.isArray(params.game)?params.game[0]:params.game;
 const slug=Array.isArray(params.slug)?params.slug[0]:params.slug;
 const {data}=useApiResource<Payload>('/channels/'+encodeURIComponent(game||'')+'/playlists/'+encodeURIComponent(slug||''),empty);
 return <Screen>
  <PageHeader title={data.playlist.title||'Playlist'} subtitle={data.channel.name||'GAME PLAYLIST'} />
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   {data.playlist.cover_url?<Image source={{uri:data.playlist.cover_url}} style={styles.cover} contentFit="cover" cachePolicy="memory-disk"/>:null}
   {data.playlist.description?<Text style={styles.description}>{data.playlist.description}</Text>:null}
   <View style={styles.list}>{(data.playlist.videos||[]).map((item)=><ContentCard key={item.id} item={item} width="100%" onPress={()=>router.push({pathname:'/content/[slug]',params:{slug:item.slug}})} />)}</View>
  </ScrollView>
 </Screen>
}
const styles=StyleSheet.create({content:{paddingHorizontal:layout.screenPadding,paddingBottom:90},cover:{width:'100%',height:220,borderRadius:24,backgroundColor:palette.surface},description:{color:palette.textMuted,fontFamily:fontFamily.regular,lineHeight:24,textAlign:'right',marginTop:spacing.lg},list:{gap:spacing.md,marginTop:spacing.xl}});

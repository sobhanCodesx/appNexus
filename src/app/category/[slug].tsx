import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ProductCard, type ProductSummary } from '@/components/cards/product-card';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type Category = { id:number; name:string; slug:string; description?:string|null; children?: {id:number;name:string;slug:string}[] };
type Payload = { category: Category; products: Paginated<ProductSummary> };
const empty:Payload={category:{id:0,name:'',slug:''},products:{data:[]}};

export default function CategoryScreen(){
  const {slug:raw}=useLocalSearchParams<{slug:string}>();
  const slug=Array.isArray(raw)?raw[0]:raw;
  const {data,refreshing,refresh}=useApiResource<Payload>('/categories/'+encodeURIComponent(slug||''),empty);
  return <Screen>
    <PageHeader title={data.category.name||'Category'} subtitle="STORE CATEGORY" onSearch={()=>router.push('/search')} />
    <FlashList
      data={data.products.data||[]}
      numColumns={2}
      refreshing={refreshing}
      onRefresh={refresh}
      ListHeaderComponent={data.category.description?<Text style={styles.description}>{data.category.description}</Text>:null}
      contentContainerStyle={styles.content}
      renderItem={({item})=><View style={styles.cell}><ProductCard product={item} width="100%" onPress={()=>router.push({pathname:'/product/[slug]',params:{slug:item.slug}})} /></View>}
      ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>محصولی در این دسته نیست.</Text></View>}
    />
  </Screen>
}
const styles=StyleSheet.create({
 content:{paddingHorizontal:layout.screenPadding-6,paddingBottom:90},
 cell:{padding:6},
 description:{color:palette.textMuted,fontFamily:fontFamily.regular,lineHeight:24,textAlign:'right',paddingHorizontal:6,paddingBottom:spacing.lg},
 empty:{paddingTop:80,alignItems:'center'},emptyText:{color:palette.textMuted,fontFamily:fontFamily.regular}
});

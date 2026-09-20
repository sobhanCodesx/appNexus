import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';

type Category = { id: number; name: string; slug: string; image_url?: string | null; products_count?: number; children?: Category[] };
type Payload = { categories: Category[] };

export default function CategoriesScreen() {
  const { data, refreshing, refresh } = useApiResource<Payload>('/categories', { categories: [] });
  return (
    <Screen>
      <PageHeader title="Categories" subtitle="STORE DIRECTORY" />
      <FlashList
        data={data.categories || []}
        refreshing={refreshing}
        onRefresh={refresh}
        numColumns={2}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <PressableScale
              style={styles.card}
              onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: item.slug } })}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" /> : <View style={styles.fallback}><View style={styles.core} /></View>}
              <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{(item.products_count || 0).toLocaleString('fa-IR')} محصول</Text>
            </PressableScale>
          </View>
        )}
      />
    </Screen>
  );
}

const styles=StyleSheet.create({
  content:{paddingHorizontal:layout.screenPadding-6,paddingBottom:90},
  cell:{padding:6},
  card:{minHeight:180,borderRadius:radii.xl,borderWidth:1,borderColor:palette.line,backgroundColor:'rgba(255,255,255,0.03)',padding:spacing.sm,alignItems:'flex-end'},
  image:{width:'100%',height:112,borderRadius:radii.lg,backgroundColor:palette.surface},
  fallback:{width:'100%',height:112,borderRadius:radii.lg,backgroundColor:'rgba(88,244,255,0.05)',alignItems:'center',justifyContent:'center'},
  core:{width:18,height:18,borderRadius:6,backgroundColor:palette.cyan,transform:[{rotate:'45deg'}]},
  name:{color:palette.white,fontFamily:fontFamily.black,textAlign:'right',marginTop:spacing.sm},
  meta:{color:palette.textMuted,fontFamily:fontFamily.regular,fontSize:10,marginTop:3}
});

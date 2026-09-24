import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';

type InvoiceItem={
  id:number;title:string;variant_name?:string|null;sku?:string|null;quantity:number;
  regular_unit_price?:number;unit_price?:number;discount_amount?:number;line_total?:number;cover_url?:string|null;
};
type Invoice={
  id:number;number:string;status:string;shipping_address?:Record<string,string|null>;
  regular_subtotal?:number;product_discount?:number;subtotal?:number;coupon_code?:string|null;coupon_discount?:number;
  delivery_fee?:number;grand_total?:number;wallet_used?:number;payable_amount?:number;cashback_amount?:number;
  exchange_credit_used?:number;created_at?:string;
  customer?:{name?:string|null;email?:string|null;phone?:string|null};
  items?:InvoiceItem[];
};
type Payload={invoice:Invoice};
const empty:Payload={invoice:{id:0,number:'',status:'',items:[]}};

function money(value?:number){return (value||0).toLocaleString('fa-IR')+' تومان';}

export default function InvoiceScreen(){
 const {id:raw}=useLocalSearchParams<{id:string}>();
 const id=Array.isArray(raw)?raw[0]:raw;
 const {data,error}=useApiResource<Payload>('/orders/'+encodeURIComponent(id||'')+'/invoice',empty);
 const invoice=data.invoice;
 return <Screen>
  <PageHeader title="Invoice" subtitle={invoice.number||'ORDER INVOICE'} />
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   {error?<Text style={styles.error}>{error}</Text>:null}
   <View style={styles.hero}>
    <Text style={styles.kicker}>PLAYNEXUS INVOICE</Text>
    <Text style={styles.number}>{invoice.number}</Text>
    <Text style={styles.meta}>{invoice.created_at?new Date(invoice.created_at).toLocaleString('fa-IR'):''}</Text>
   </View>
   <Section title="خریدار">
    <Row label="نام" value={String(invoice.customer?.name||'—')}/>
    <Row label="موبایل" value={String(invoice.customer?.phone||'—')}/>
    <Row label="ایمیل" value={String(invoice.customer?.email||'—')}/>
   </Section>
   <Section title="اقلام">
    <View style={styles.items}>
     {(invoice.items||[]).map(item=><View key={item.id} style={styles.item}>
      {item.cover_url?<Image source={{uri:item.cover_url}} style={styles.cover} contentFit="cover" cachePolicy="memory-disk"/>:null}
      <View style={styles.itemCopy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemMeta}>{item.variant_name||item.sku||'STANDARD'} · {item.quantity.toLocaleString('fa-IR')} عدد</Text></View>
      <Text style={styles.itemPrice}>{money(item.line_total)}</Text>
     </View>)}
    </View>
   </Section>
   <Section title="پرداخت">
    <Row label="جمع محصولات" value={money(invoice.regular_subtotal)}/>
    {(invoice.product_discount||0)>0?<Row label="تخفیف محصول" value={'− '+money(invoice.product_discount)} accent/>:null}
    {(invoice.coupon_discount||0)>0?<Row label={'کد تخفیف '+(invoice.coupon_code||'')} value={'− '+money(invoice.coupon_discount)} accent/>:null}
    {(invoice.exchange_credit_used||0)>0?<Row label="اعتبار معاوضه" value={'− '+money(invoice.exchange_credit_used)} accent/>:null}
    {(invoice.wallet_used||0)>0?<Row label="کیف پول" value={'− '+money(invoice.wallet_used)} accent/>:null}
    {(invoice.delivery_fee||0)>0?<Row label="ارسال" value={money(invoice.delivery_fee)}/>:null}
    <View style={styles.divider}/>
    <Row label="مبلغ نهایی" value={money(invoice.grand_total)} strong/>
    <Row label="پرداخت‌شده" value={money(invoice.payable_amount)} strong/>
    {(invoice.cashback_amount||0)>0?<Row label="کش‌بک" value={money(invoice.cashback_amount)} accent/>:null}
   </Section>
   {invoice.shipping_address?<Section title="آدرس تحویل">
    <Text style={styles.address}>{[invoice.shipping_address.province,invoice.shipping_address.city,invoice.shipping_address.address_line].filter(Boolean).join('، ')}</Text>
   </Section>:null}
  </ScrollView>
 </Screen>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Row({label,value,accent=false,strong=false}:{label:string;value:string;accent?:boolean;strong?:boolean}){return <View style={styles.row}><Text style={[styles.value,accent&&styles.accent,strong&&styles.strong]}>{value}</Text><Text style={[styles.label,strong&&styles.strong]}>{label}</Text></View>}
const styles=StyleSheet.create({
 content:{paddingHorizontal:layout.screenPadding,paddingBottom:90,gap:spacing.lg},
 hero:{minHeight:120,borderRadius:radii.xl,borderWidth:1,borderColor:'rgba(88,244,255,0.18)',backgroundColor:'rgba(88,244,255,0.04)',padding:spacing.lg,alignItems:'flex-end'},
 kicker:{color:palette.cyan,fontFamily:fontFamily.black,fontSize:8,letterSpacing:1},number:{color:palette.white,fontFamily:fontFamily.black,fontSize:24,marginTop:4},meta:{color:palette.textMuted,fontFamily:fontFamily.regular,fontSize:10,marginTop:4},
 section:{borderRadius:radii.xl,borderWidth:1,borderColor:palette.line,backgroundColor:'rgba(255,255,255,0.03)',padding:spacing.lg},
 sectionTitle:{color:palette.white,fontFamily:fontFamily.black,fontSize:18,textAlign:'right',marginBottom:spacing.md},
 row:{flexDirection:'row',justifyContent:'space-between',gap:spacing.md,paddingVertical:6},label:{color:palette.textMuted,fontFamily:fontFamily.regular},value:{color:palette.text,fontFamily:fontFamily.bold},accent:{color:palette.success},strong:{color:palette.white,fontFamily:fontFamily.black},
 items:{gap:spacing.sm},item:{minHeight:76,flexDirection:'row',alignItems:'center',gap:spacing.sm},cover:{width:54,height:62,borderRadius:14},itemCopy:{flex:1,alignItems:'flex-end'},itemTitle:{color:palette.white,fontFamily:fontFamily.black,textAlign:'right'},itemMeta:{color:palette.textMuted,fontFamily:fontFamily.regular,fontSize:9,marginTop:3},itemPrice:{color:palette.cyan,fontFamily:fontFamily.bold,fontSize:11},
 divider:{height:1,backgroundColor:palette.line,marginVertical:spacing.sm},address:{color:palette.textMuted,fontFamily:fontFamily.regular,lineHeight:23,textAlign:'right'},error:{color:palette.danger,fontFamily:fontFamily.regular,textAlign:'right'}
});

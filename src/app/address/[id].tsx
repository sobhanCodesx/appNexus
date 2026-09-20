import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type Address = {
  id:number; title:string; recipient_name:string; phone:string; province:string; city:string;
  postal_code?:string|null; address_line:string; plaque?:string|null; unit?:string|null; is_default?:boolean;
};
type Payload={addresses:Address[]};

export default function EditAddressScreen(){
  const {id:raw}=useLocalSearchParams<{id:string}>();
  const id=Number(Array.isArray(raw)?raw[0]:raw);
  const [form,setForm]=useState<Address|null>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    void apiRequest<Payload>('/addresses').then(({addresses})=>{
      setForm(addresses.find(item=>item.id===id)??null);
    });
  },[id]);

  const save=async()=>{
    if(!form)return;
    setSaving(true);setMessage(null);
    try{
      const result=await apiRequest<{message:string;address:Address}>('/addresses/'+id,{
        method:'PUT',
        body:JSON.stringify({
          title:form.title,recipient_name:form.recipient_name,phone:form.phone,
          province:form.province,city:form.city,postal_code:form.postal_code||null,
          address_line:form.address_line,plaque:form.plaque||null,unit:form.unit||null,
          is_default:Boolean(form.is_default),
        }),
      });
      setForm(result.address);
      invalidateResource('/addresses');
      setMessage(result.message);
    }catch(error){
      setMessage(error instanceof Error?error.message:'ویرایش آدرس انجام نشد.');
    }finally{setSaving(false);}
  };

  if(!form){
    return <Screen><PageHeader title="Edit Address" subtitle="DELIVERY NODE"/><View style={styles.center}><Text style={styles.muted}>در حال بارگذاری آدرس…</Text></View></Screen>
  }

  const set=<K extends keyof Address>(key:K,value:Address[K])=>setForm(prev=>prev?{...prev,[key]:value}:prev);

  return <Screen>
    <PageHeader title="Edit Address" subtitle="DELIVERY NODE"/>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="عنوان" value={form.title} onChangeText={v=>set('title',v)}/>
      <Field label="تحویل‌گیرنده" value={form.recipient_name} onChangeText={v=>set('recipient_name',v)}/>
      <Field label="موبایل" value={form.phone} onChangeText={v=>set('phone',v)} keyboardType="phone-pad"/>
      <View style={styles.split}>
        <View style={styles.half}><Field label="استان" value={form.province} onChangeText={v=>set('province',v)}/></View>
        <View style={styles.half}><Field label="شهر" value={form.city} onChangeText={v=>set('city',v)}/></View>
      </View>
      <Field label="نشانی" value={form.address_line} onChangeText={v=>set('address_line',v)} multiline/>
      <View style={styles.split}>
        <View style={styles.half}><Field label="پلاک" value={form.plaque||''} onChangeText={v=>set('plaque',v)}/></View>
        <View style={styles.half}><Field label="واحد" value={form.unit||''} onChangeText={v=>set('unit',v)}/></View>
      </View>
      <Field label="کدپستی" value={form.postal_code||''} onChangeText={v=>set('postal_code',v)} keyboardType="number-pad"/>
      <View style={styles.defaultRow}>
        <Switch value={Boolean(form.is_default)} onValueChange={v=>set('is_default',v)} trackColor={{false:palette.surfaceBright,true:palette.blueHot}} thumbColor={palette.white}/>
        <View style={styles.copy}><Text style={styles.defaultTitle}>آدرس پیش‌فرض</Text><Text style={styles.caption}>برای Checkout بعدی اول این مقصد انتخاب می‌شود.</Text></View>
      </View>
      {message?<Text style={styles.message}>{message}</Text>:null}
      <PressableScale disabled={saving} onPress={()=>void save()} style={styles.primary}><Text style={styles.primaryText}>{saving?'در حال ذخیره…':'ذخیره ویرایش'}</Text></PressableScale>
      <PressableScale haptic={false} onPress={()=>router.back()} style={styles.cancel}><Text style={styles.cancelText}>برگشت</Text></PressableScale>
    </ScrollView>
  </Screen>
}

function Field({label,...props}:{label:string;value:string;onChangeText:(v:string)=>void;keyboardType?:'default'|'phone-pad'|'number-pad';multiline?:boolean}){
 return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={palette.textDim} textAlign="right" style={[styles.input,props.multiline&&styles.multi]}/></View>
}
const styles=StyleSheet.create({
 content:{paddingHorizontal:layout.screenPadding,paddingBottom:80,gap:spacing.md},
 center:{flex:1,alignItems:'center',justifyContent:'center'},muted:{color:palette.textMuted,fontFamily:fontFamily.regular},
 field:{gap:5},label:{color:palette.textMuted,fontFamily:fontFamily.bold,textAlign:'right',fontSize:11},
 input:{minHeight:56,borderRadius:radii.lg,borderWidth:1,borderColor:palette.line,backgroundColor:'rgba(255,255,255,0.03)',color:palette.white,paddingHorizontal:spacing.md,fontFamily:fontFamily.regular},
 multi:{minHeight:110,textAlignVertical:'top',paddingTop:spacing.md},split:{flexDirection:'row-reverse',gap:spacing.sm},half:{flex:1},
 defaultRow:{minHeight:74,borderRadius:radii.lg,borderWidth:1,borderColor:palette.line,padding:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.md},
 copy:{flex:1,alignItems:'flex-end'},defaultTitle:{color:palette.white,fontFamily:fontFamily.black},caption:{color:palette.textMuted,fontFamily:fontFamily.regular,fontSize:10,marginTop:3,textAlign:'right'},
 message:{color:palette.warning,fontFamily:fontFamily.regular,textAlign:'right'},primary:{minHeight:56,borderRadius:radii.lg,backgroundColor:palette.white,alignItems:'center',justifyContent:'center'},
 primaryText:{color:palette.ink,fontFamily:fontFamily.black},cancel:{minHeight:46,alignItems:'center',justifyContent:'center'},cancelText:{color:palette.textMuted,fontFamily:fontFamily.bold}
});

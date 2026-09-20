import * as SecureStore from 'expo-secure-store';

const KEY = 'playnexus.onboarding.v1';

export async function hasCompletedOnboarding() {
  return (await SecureStore.getItemAsync(KEY)) === '1';
}

export async function completeOnboarding() {
  await SecureStore.setItemAsync(KEY, '1');
}

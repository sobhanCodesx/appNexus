import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const INSTALLATION_ID_KEY = 'playnexus.installation-id.v1';

export async function getInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const installationId = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });

  return installationId;
}

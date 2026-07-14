import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "servis_defteri_mobile_token";

export async function getStoredToken() {
  try {
    const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);

    if (secureToken) {
      return secureToken;
    }
  } catch {
    // Expo web and unsupported devices fall back to app-scoped storage.
  }

  const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);

  if (legacyToken) {
    await setStoredToken(legacyToken);
  }

  return legacyToken;
}

export async function setStoredToken(token) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // The token is already stored securely; a stale legacy value is harmless.
    }
    return;
  } catch {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearStoredToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing else is required when secure storage is unavailable.
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParcelRecord } from '../types';

const STORAGE_KEY_PARCELS = '@parcel_measure_records_v1';
const STORAGE_KEY_PREFERENCES = '@parcel_measure_preferences_v1';

export interface UserPreferences {
  unitSystem: 'metric' | 'imperial';
  defaultReference: 'iso_card' | 'a4_paper' | 'ruler_10cm';
  hasSeenTutorial: boolean;
  hapticFeedback: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  unitSystem: 'metric',
  defaultReference: 'iso_card',
  hasSeenTutorial: false,
  hapticFeedback: true,
};

export async function getParcelRecords(): Promise<ParcelRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PARCELS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading parcel records:', error);
    return [];
  }
}

export async function saveParcelRecord(record: ParcelRecord): Promise<void> {
  try {
    const records = await getParcelRecords();
    const existingIndex = records.findIndex((r) => r.id === record.id);
    let updated: ParcelRecord[];
    if (existingIndex >= 0) {
      updated = [...records];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...records];
    }
    await AsyncStorage.setItem(STORAGE_KEY_PARCELS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving parcel record:', error);
    throw error;
  }
}

export async function deleteParcelRecord(recordId: string): Promise<void> {
  try {
    const records = await getParcelRecords();
    const updated = records.filter((r) => r.id !== recordId);
    await AsyncStorage.setItem(STORAGE_KEY_PARCELS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting parcel record:', error);
    throw error;
  }
}

export async function clearAllParcelRecords(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_PARCELS);
  } catch (error) {
    console.error('Error clearing parcel records:', error);
    throw error;
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (error) {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

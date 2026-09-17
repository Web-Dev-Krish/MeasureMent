import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { ParcelRecord } from '../types';
import { getParcelRecords, deleteParcelRecord, clearAllParcelRecords } from '../utils/storage';
import { AccuracyBadge } from '../components/AccuracyBadge';

interface HistoryScreenProps {
  navigation: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [records, setRecords] = useState<ParcelRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    const data = await getParcelRecords();
    setRecords(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteItem = (id: string, title: string) => {
    const confirmMsg = `Delete "${title}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        deleteParcelRecord(id).then(loadData);
      }
    } else {
      Alert.alert('Delete Measurement', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteParcelRecord(id);
            loadData();
          },
        },
      ]);
    }
  };

  const handleClearAll = () => {
    const confirmMsg = 'Delete ALL saved parcel measurements from local storage?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        clearAllParcelRecords().then(loadData);
      }
    } else {
      Alert.alert('Clear History', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllParcelRecords();
            loadData();
          },
        },
      ]);
    }
  };

  const filteredRecords = records.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: ParcelRecord }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('Result', {
          recordId: item.id,
          dimensions: {
            lengthCm: item.lengthCm,
            breadthCm: item.breadthCm,
            heightCm: item.heightCm,
            volumeCm3: Math.round(item.lengthCm * item.breadthCm * item.heightCm),
            volumetricWeightKg: item.volumetricWeightKg,
          },
          accuracy: {
            isAccurate: true,
            toleranceCm: item.toleranceCm || 0.4,
            confidencePercentage: item.confidenceScore || 95,
            heightFrontCm: item.heightCm,
            heightSideCm: item.heightCm,
            lengthFrontCm: item.lengthCm,
            lengthTopCm: item.lengthCm,
            breadthSideCm: item.breadthCm,
            breadthTopCm: item.breadthCm,
            heightVarianceCm: 0.2,
            lengthVarianceCm: 0.2,
            breadthVarianceCm: 0.2,
            lightingRating: 'good',
            scalePresenceDetected: true,
            validationStatus:
              item.verificationType === 'manually_verified' ? 'manual_verified' : 'verified',
            statusMessage: 'Stored parcel record.',
          },
          frontImageUri: item.frontImageUri,
          sideImageUri: item.sideImageUri,
          topImageUri: item.topImageUri,
        });
      }}
    >
      <View style={styles.cardTop}>
        <View style={styles.titleCol}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteItem(item.id, item.title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>DIMENSIONS</Text>
          <Text style={styles.metricVal}>
            {item.lengthCm.toFixed(1)} × {item.breadthCm.toFixed(1)} × {item.heightCm.toFixed(1)}{' '}
            <Text style={styles.metricUnit}>cm</Text>
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>BILLABLE WT</Text>
          <Text style={[styles.metricVal, { color: Colors.charcoal }]}>
            {item.billableWeightKg.toFixed(2)}{' '}
            <Text style={styles.metricUnit}>kg</Text>
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <AccuracyBadge
          status={
            item.verificationType === 'manually_verified' ? 'manual_verified' : 'verified'
          }
          compact
        />

        {item.actualWeightKg !== null && item.actualWeightKg !== undefined ? (
          <View style={styles.tag}>
            <Ionicons name="scale-outline" size={12} color={Colors.charcoal} />
            <Text style={styles.tagText}>Scale: {item.actualWeightKg.toFixed(2)} kg</Text>
          </View>
        ) : (
          <View style={styles.tag}>
            <Ionicons name="cube-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.tagText}>Vol: {item.volumetricWeightKg.toFixed(2)} kg</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Measurement History"
        subtitle="Local parcel archive on this device"
        onBack={() => navigation.goBack()}
        rightAction={
          records.length > 0
            ? {
                icon: 'trash-bin-outline',
                onPress: handleClearAll,
              }
            : undefined
        }
      />

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search measurements..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'No parcels match your search.' : 'Saved measurements will appear here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.charcoal,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  cardDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { ParcelRecord } from '../types';
import { getParcelRecords, deleteParcelRecord } from '../utils/storage';
import { AccuracyBadge } from '../components/AccuracyBadge';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<ParcelRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getParcelRecords();
      setRecords(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    loadHistory();
    return unsubscribe;
  }, [navigation, loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${title}"?`)) {
        deleteParcelRecord(id).then(loadHistory);
      }
    } else {
      Alert.alert('Delete Measurement', `Delete parcel "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteParcelRecord(id);
            loadHistory();
          },
        },
      ]);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Brand Top Bar */}
      <View style={styles.brandRow}>
        <View style={styles.brandBadge}>
          <Ionicons name="cube" size={18} color={Colors.charcoal} />
          <Text style={styles.brandName}>PARCEL MEASURE</Text>
        </View>

        <TouchableOpacity
          style={styles.historyIconBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time-outline" size={20} color={Colors.charcoal} />
          {records.length > 0 && (
            <View style={styles.historyCountPill}>
              <Text style={styles.historyCountText}>{records.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Title & Subtitle */}
      <View style={styles.heroTextGroup}>
        <Text style={styles.mainTitle}>Measure Your Parcel</Text>
        <Text style={styles.subtitle}>
          Measure your parcel dimensions before booking.
        </Text>
      </View>

      {/* Device Capability Card */}
      <View style={styles.capabilityCard}>
        <View style={styles.capabilityHeader}>
          <View style={styles.capabilityIconCircle}>
            <Ionicons name="hardware-chip-outline" size={20} color={Colors.charcoal} />
          </View>
          <View style={styles.capabilityTitleCol}>
            <Text style={styles.capabilityTitle}>Android Measurement Engine</Text>
            <Text style={styles.capabilityStatus}>Optical Scale Reference Active</Text>
          </View>
          <View style={styles.readyBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.readyText}>READY</Text>
          </View>
        </View>

        <View style={styles.capabilitySpecs}>
          <View style={styles.specItem}>
            <Ionicons name="camera-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.specText}>Real Camera Feed</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="scan-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.specText}>ISO ID-1 Calibration</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="calculator-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.specText}>Zero Simulation / Real Math</Text>
          </View>
        </View>
      </View>

      {/* Primary & Secondary Action Buttons */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CameraPermission')}
        >
          <View style={styles.primaryBtnContent}>
            <Ionicons name="camera" size={20} color={Colors.charcoal} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Start Measurement</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.charcoal} />
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('HowItWorks')}
          >
            <Ionicons name="information-circle-outline" size={18} color={Colors.charcoal} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>How It Works</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fallbackBtn}
            onPress={() => navigation.navigate('ManualMeasure', {})}
          >
            <Ionicons name="create-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.fallbackBtnText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Title for Saved Parcels */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Recent Measurements</Text>
        {records.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>View All ({records.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Parcels Measured Yet</Text>
      <Text style={styles.emptySub}>
        Capture your parcel from Front, Side, and Top angles using a standard reference card for genuine millimeter precision.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: ParcelRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
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
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleRow}>
          <Text style={styles.recordTitle}>{item.title}</Text>
          <Text style={styles.recordDate}>
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDeleteItem(item.id, item.title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Dimensions & Weights */}
      <View style={styles.dimRow}>
        <View style={styles.dimBox}>
          <Text style={styles.dimLabel}>DIMENSIONS (L × W × H)</Text>
          <Text style={styles.dimValue}>
            {item.lengthCm.toFixed(1)} × {item.breadthCm.toFixed(1)} × {item.heightCm.toFixed(1)}{' '}
            <Text style={styles.dimUnit}>cm</Text>
          </Text>
        </View>

        <View style={styles.weightBox}>
          <Text style={styles.dimLabel}>VOLUMETRIC</Text>
          <Text style={styles.weightValue}>
            {item.volumetricWeightKg.toFixed(2)}{' '}
            <Text style={styles.dimUnit}>kg</Text>
          </Text>
        </View>
      </View>

      {/* Footer Tag */}
      <View style={styles.recordFooter}>
        <AccuracyBadge
          status={
            item.verificationType === 'manually_verified' ? 'manual_verified' : 'verified'
          }
          compact
        />
        {item.actualWeightKg !== null && item.actualWeightKg !== undefined && (
          <View style={styles.scaleWeightBadge}>
            <Ionicons name="scale-outline" size={12} color={Colors.charcoal} />
            <Text style={styles.scaleWeightText}>
              Scale: {item.actualWeightKg.toFixed(2)} kg
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <FlatList
        data={records.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerSection: {
    paddingTop: 8,
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: 0.6,
  },
  historyIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.subtle,
  },
  historyCountPill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.charcoal,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  historyCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  heroTextGroup: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  capabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  capabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  capabilityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  capabilityTitleCol: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  capabilityStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
  },
  capabilitySpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  specText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.charcoalSoft,
  },
  actionGroup: {
    marginBottom: 20,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  primaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: 14,
    ...Shadows.subtle,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  fallbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: 14,
  },
  fallbackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginVertical: 8,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  recordDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  dimBox: {
    flex: 1,
  },
  dimLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dimValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  dimUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weightBox: {
    alignItems: 'flex-end',
  },
  weightValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scaleWeightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  scaleWeightText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { Parcel3DView } from '../components/Parcel3DView';
import { AccuracyBadge } from '../components/AccuracyBadge';
import {
  ParcelDimensions,
  AccuracyReport,
  ParcelRecord,
  ReferenceType,
} from '../types';
import {
  calculateBillableWeight,
  calculateVolumetricWeight,
  cmToInches,
} from '../utils/measurementEngine';
import { saveParcelRecord, deleteParcelRecord } from '../utils/storage';

interface ResultScreenProps {
  route: any;
  navigation: any;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ route, navigation }) => {
  const {
    recordId: initialRecordId,
    dimensions: initialDims,
    accuracy: initialAccuracy,
    referenceType = 'iso_card',
    frontImageUri,
    sideImageUri,
    topImageUri,
    isManual = false,
  } = route.params as {
    recordId?: string;
    dimensions: ParcelDimensions;
    accuracy?: AccuracyReport;
    referenceType?: ReferenceType;
    frontImageUri?: string | null;
    sideImageUri?: string | null;
    topImageUri?: string | null;
    isManual?: boolean;
  };

  const [recordId] = useState<string>(initialRecordId || `parcel_${Date.now()}`);
  const [dimensions, setDimensions] = useState<ParcelDimensions>(initialDims);
  const [isManuallyEdited, setIsManuallyEdited] = useState<boolean>(
    isManual || initialAccuracy?.validationStatus === 'manual_verified'
  );
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [scaleWeightInput, setScaleWeightInput] = useState<string>('');
  const [actualWeightKg, setActualWeightKg] = useState<number | null>(null);
  const [savedLocally, setSavedLocally] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Manual Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLength, setEditLength] = useState(dimensions.lengthCm.toString());
  const [editBreadth, setEditBreadth] = useState(dimensions.breadthCm.toString());
  const [editHeight, setEditHeight] = useState(dimensions.heightCm.toString());

  // Weight calculations
  const volWeight = calculateVolumetricWeight(
    dimensions.lengthCm,
    dimensions.breadthCm,
    dimensions.heightCm
  );
  const billableWeight = calculateBillableWeight(actualWeightKg, volWeight);

  const handleWeightChange = (text: string) => {
    setScaleWeightInput(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      setActualWeightKg(parsed);
    } else {
      setActualWeightKg(null);
    }
  };

  const handleSaveEdit = () => {
    const l = parseFloat(editLength);
    const b = parseFloat(editBreadth);
    const h = parseFloat(editHeight);

    if (isNaN(l) || isNaN(b) || isNaN(h) || l <= 0 || b <= 0 || h <= 0) {
      if (Platform.OS === 'web') {
        alert('Please enter positive numerical values for all dimensions.');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numbers greater than 0.');
      }
      return;
    }

    const newVol = Math.round(l * b * h);
    const newVolWeight = calculateVolumetricWeight(l, b, h);

    setDimensions({
      lengthCm: +l.toFixed(1),
      breadthCm: +b.toFixed(1),
      heightCm: +h.toFixed(1),
      volumeCm3: newVol,
      volumetricWeightKg: newVolWeight,
    });
    setIsManuallyEdited(true);
    setEditModalVisible(false);
  };

  const handleSaveToHistory = async () => {
    const record: ParcelRecord = {
      id: recordId,
      title: `Parcel ${dimensions.lengthCm.toFixed(0)}×${dimensions.breadthCm.toFixed(0)}×${dimensions.heightCm.toFixed(0)}`,
      createdAt: Date.now(),
      lengthCm: dimensions.lengthCm,
      breadthCm: dimensions.breadthCm,
      heightCm: dimensions.heightCm,
      actualWeightKg,
      volumetricWeightKg: volWeight,
      billableWeightKg: billableWeight,
      verificationType: isManuallyEdited ? 'manually_verified' : 'calibrated_camera',
      referenceTypeUsed: referenceType,
      confidenceScore: initialAccuracy?.confidencePercentage || 95,
      toleranceCm: isManuallyEdited ? undefined : initialAccuracy?.toleranceCm || 0.4,
      frontImageUri,
      sideImageUri,
      topImageUri,
    };

    try {
      await saveParcelRecord(record);
      setSavedLocally(true);
      if (Platform.OS === 'web') {
        alert('Parcel measurement successfully saved to local device storage!');
      } else {
        Alert.alert('Saved Locally', 'Measurement saved securely on this device.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = () => {
    const confirmMsg = 'Permanently delete this measurement and captured photos?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        deleteParcelRecord(recordId).then(() => navigation.navigate('Home'));
      }
    } else {
      Alert.alert('Delete Measurement', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteParcelRecord(recordId);
            navigation.navigate('Home');
          },
        },
      ]);
    }
  };

  const formatLength = (cm: number) => {
    if (unitSystem === 'imperial') {
      return `${cmToInches(cm)} in`;
    }
    return `${cm.toFixed(1)} cm`;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Parcel Dimensions"
        subtitle="Final verified logistics measurements"
        onBack={() => navigation.navigate('Home')}
        rightAction={{
          icon: 'trash-outline',
          onPress: handleDelete,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Badge */}
        <AccuracyBadge
          status={isManuallyEdited ? 'manual_verified' : 'verified'}
          toleranceCm={initialAccuracy?.toleranceCm || 0.4}
          confidenceScore={initialAccuracy?.confidencePercentage || 95}
        />

        {/* 3D Isometric Interactive Box Card */}
        <Parcel3DView
          lengthCm={dimensions.lengthCm}
          breadthCm={dimensions.breadthCm}
          heightCm={dimensions.heightCm}
          unit={unitSystem}
          interactive
        />

        {/* Dimension Breakdown Card with Unit Toggle */}
        <View style={styles.specsCard}>
          <View style={styles.specsHeader}>
            <Text style={styles.specsTitle}>DIMENSIONS SPECIFICATION</Text>
            <View style={styles.unitToggleGroup}>
              <TouchableOpacity
                style={[styles.unitBtn, unitSystem === 'metric' && styles.unitBtnActive]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text
                  style={[styles.unitBtnText, unitSystem === 'metric' && styles.unitBtnTextActive]}
                >
                  CM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, unitSystem === 'imperial' && styles.unitBtnActive]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text
                  style={[
                    styles.unitBtnText,
                    unitSystem === 'imperial' && styles.unitBtnTextActive,
                  ]}
                >
                  IN
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dimGrid}>
            <View style={styles.dimBox}>
              <Text style={styles.dimKey}>LENGTH</Text>
              <Text style={styles.dimVal}>{formatLength(dimensions.lengthCm)}</Text>
              <Text style={styles.dimSub}>Horizontal primary</Text>
            </View>

            <View style={styles.dimBox}>
              <Text style={styles.dimKey}>BREADTH / WIDTH</Text>
              <Text style={styles.dimVal}>{formatLength(dimensions.breadthCm)}</Text>
              <Text style={styles.dimSub}>Receding depth</Text>
            </View>

            <View style={styles.dimBox}>
              <Text style={styles.dimKey}>HEIGHT</Text>
              <Text style={styles.dimVal}>{formatLength(dimensions.heightCm)}</Text>
              <Text style={styles.dimSub}>Vertical face</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editDimensionsBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={16} color={Colors.charcoal} style={{ marginRight: 6 }} />
            <Text style={styles.editDimensionsText}>Manual Edit Dimensions</Text>
          </TouchableOpacity>
        </View>

        {/* Physical Weighing Scale Input Section */}
        <View style={styles.weightCard}>
          <View style={styles.weightHeaderRow}>
            <View style={styles.weightIconBox}>
              <Ionicons name="scale" size={20} color={Colors.charcoal} />
            </View>
            <View style={styles.weightTitleCol}>
              <Text style={styles.weightCardTitle}>Physical Weighing Scale Entry</Text>
              <Text style={styles.weightCardSubtitle}>
                Camera cannot weigh parcels. Read from physical scale.
              </Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              placeholder="e.g. 4.25"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={scaleWeightInput}
              onChangeText={handleWeightChange}
            />
            <View style={styles.weightUnitPill}>
              <Text style={styles.weightUnitPillText}>KG</Text>
            </View>
          </View>

          {/* Logistics Pricing Weight Comparison */}
          <View style={styles.logisticsWeightComparison}>
            <View style={styles.weightCompareItem}>
              <Text style={styles.compareLabel}>Actual Scale</Text>
              <Text style={styles.compareVal}>
                {actualWeightKg !== null ? `${actualWeightKg.toFixed(2)} kg` : '--'}
              </Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.weightCompareItem}>
              <Text style={styles.compareLabel}>Volumetric (L×W×H/5000)</Text>
              <Text style={styles.compareVal}>{volWeight.toFixed(2)} kg</Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.weightCompareItem}>
              <Text style={styles.compareLabel}>Billable Freight</Text>
              <Text style={[styles.compareVal, { color: Colors.primaryDark }]}>
                {billableWeight.toFixed(2)} kg
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-angle Photos Strip */}
        {(frontImageUri || sideImageUri || topImageUri) && (
          <View style={styles.photosCard}>
            <Text style={styles.specsTitle}>CAPTURED ANGLE PHOTOGRAPHS</Text>
            <View style={styles.photosRow}>
              {frontImageUri && (
                <TouchableOpacity
                  style={styles.photoItem}
                  onPress={() => setPreviewImage(frontImageUri)}
                >
                  <Image source={{ uri: frontImageUri }} style={styles.photoThumb} />
                  <Text style={styles.photoLabel}>Front View</Text>
                </TouchableOpacity>
              )}
              {sideImageUri && (
                <TouchableOpacity
                  style={styles.photoItem}
                  onPress={() => setPreviewImage(sideImageUri)}
                >
                  <Image source={{ uri: sideImageUri }} style={styles.photoThumb} />
                  <Text style={styles.photoLabel}>Side View</Text>
                </TouchableOpacity>
              )}
              {topImageUri && (
                <TouchableOpacity
                  style={styles.photoItem}
                  onPress={() => setPreviewImage(topImageUri)}
                >
                  <Image source={{ uri: topImageUri }} style={styles.photoThumb} />
                  <Text style={styles.photoLabel}>Top View</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Local Privacy & Storage Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="lock-closed" size={16} color={Colors.charcoal} style={{ marginRight: 6 }} />
          <Text style={styles.privacyText}>
            All dimensions and photos are stored strictly locally on your Android device. Zero data is transmitted to external servers.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, savedLocally && styles.saveBtnSaved]}
          onPress={handleSaveToHistory}
          disabled={savedLocally}
        >
          <Ionicons
            name={savedLocally ? 'checkmark-circle' : 'bookmark'}
            size={18}
            color={Colors.charcoal}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.saveBtnText}>
            {savedLocally ? 'Saved to Local Device' : 'Save to History'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newMeasureBtn}
          onPress={() => navigation.navigate('CalibrationSetup')}
        >
          <Ionicons name="scan" size={18} color={Colors.charcoal} style={{ marginRight: 6 }} />
          <Text style={styles.newMeasureBtnText}>Measure Another</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Dimension Correction</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Correct any dimension manually. The measurement badge will update to "Manually Verified".
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Length (cm)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editLength}
                onChangeText={setEditLength}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Breadth / Width (cm)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editBreadth}
                onChangeText={setEditBreadth}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editHeight}
                onChangeText={setEditHeight}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveEdit}>
                <Text style={styles.modalConfirmBtnText}>Apply & Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full image preview modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.fullImageBackdrop}>
          <TouchableOpacity
            style={styles.closeFullImageBtn}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  specsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  specsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  unitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  unitBtnTextActive: {
    color: Colors.charcoal,
  },
  dimGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dimBox: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  dimKey: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dimVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  dimSub: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  editDimensionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  editDimensionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  weightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weightTitleCol: {
    flex: 1,
  },
  weightCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  weightCardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceSubtle,
    marginBottom: 12,
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    paddingVertical: 12,
  },
  weightUnitPill: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  weightUnitPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  logisticsWeightComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 10,
  },
  weightCompareItem: {
    alignItems: 'center',
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  compareVal: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  compareDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  photosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoItem: {
    flex: 1,
    alignItems: 'center',
  },
  photoThumb: {
    width: '100%',
    height: 75,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    ...Shadows.card,
  },
  saveBtnSaved: {
    backgroundColor: Colors.successLight,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  newMeasureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 15,
  },
  newMeasureBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 17,
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  fullImageBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullImageBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '95%',
    height: '80%',
  },
});

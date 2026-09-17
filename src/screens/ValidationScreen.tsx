import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { AccuracyBadge } from '../components/AccuracyBadge';
import {
  AngleCaptureData,
  ReferenceType,
} from '../types';
import {
  synthesizeMultiAngleMeasurement,
  REFERENCE_OBJECTS,
} from '../utils/measurementEngine';

interface ValidationScreenProps {
  route: any;
  navigation: any;
}

export const ValidationScreen: React.FC<ValidationScreenProps> = ({ route, navigation }) => {
  const { referenceType, frontData, sideData, topData } = route.params as {
    referenceType: ReferenceType;
    frontData: AngleCaptureData;
    sideData: AngleCaptureData;
    topData: AngleCaptureData;
  };

  const refObj = REFERENCE_OBJECTS[referenceType];

  // Synthesize dimensions using real mathematical engine
  const { dimensions, accuracy } = useMemo(() => {
    return synthesizeMultiAngleMeasurement(frontData, sideData, topData);
  }, [frontData, sideData, topData]);

  const handleProceedToResults = () => {
    navigation.replace('Result', {
      dimensions,
      accuracy,
      referenceType,
      frontImageUri: frontData.imageUri,
      sideImageUri: sideData.imageUri,
      topImageUri: topData.imageUri,
    });
  };

  const handleRetakeAll = () => {
    navigation.replace('Capture', { referenceType });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Accuracy Validation"
        subtitle="Multi-view geometric triangulation check"
        onBack={() => navigation.goBack()}
        stepInfo={{ current: 4, total: 4, label: 'Cross-Axis Validation' }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        <AccuracyBadge
          status={accuracy.validationStatus}
          toleranceCm={accuracy.toleranceCm}
          confidenceScore={accuracy.confidencePercentage}
        />

        {/* Status explanation */}
        <View style={styles.statusExplainerCard}>
          <Text style={styles.explainerTitle}>
            {accuracy.isAccurate
              ? 'Multi-Angle Triangulation Passed'
              : 'Accuracy Discrepancy Detected'}
          </Text>
          <Text style={styles.explainerText}>
            {accuracy.isAccurate
              ? 'Shared spatial axes between Front, Side, and Top camera captures are mathematically consistent within physical millimeter tolerance.'
              : accuracy.recommendation ||
                'Dimensional difference between camera captures exceeds acceptable tolerance. Please measure again or refine corner alignment.'}
          </Text>
        </View>

        {/* Real Cross-Axis Comparison Matrix */}
        <View style={styles.matrixCard}>
          <Text style={styles.matrixHeader}>CROSS-AXIS CONSISTENCY MATRIX</Text>

          {/* Height comparison (Front vs Side) */}
          <View style={styles.matrixItem}>
            <View style={styles.axisLabelRow}>
              <Text style={styles.axisName}>Height (H)</Text>
              <View
                style={[
                  styles.varBadge,
                  accuracy.heightVarianceCm <= 1.5 ? styles.varBadgePass : styles.varBadgeFail,
                ]}
              >
                <Text
                  style={[
                    styles.varBadgeText,
                    accuracy.heightVarianceCm <= 1.5
                      ? styles.varBadgeTextPass
                      : styles.varBadgeTextFail,
                  ]}
                >
                  Δ {accuracy.heightVarianceCm.toFixed(1)} cm
                </Text>
              </View>
            </View>

            <View style={styles.axisValuesRow}>
              <Text style={styles.axisSubValue}>
                Front View: <Text style={styles.axisValueBold}>{accuracy.heightFrontCm} cm</Text>
              </Text>
              <Text style={styles.axisSubValue}>
                Side View: <Text style={styles.axisValueBold}>{accuracy.heightSideCm} cm</Text>
              </Text>
            </View>
          </View>

          {/* Length comparison (Front vs Top) */}
          <View style={styles.matrixItem}>
            <View style={styles.axisLabelRow}>
              <Text style={styles.axisName}>Length (L)</Text>
              <View
                style={[
                  styles.varBadge,
                  accuracy.lengthVarianceCm <= 1.5 ? styles.varBadgePass : styles.varBadgeFail,
                ]}
              >
                <Text
                  style={[
                    styles.varBadgeText,
                    accuracy.lengthVarianceCm <= 1.5
                      ? styles.varBadgeTextPass
                      : styles.varBadgeTextFail,
                  ]}
                >
                  Δ {accuracy.lengthVarianceCm.toFixed(1)} cm
                </Text>
              </View>
            </View>

            <View style={styles.axisValuesRow}>
              <Text style={styles.axisSubValue}>
                Front View: <Text style={styles.axisValueBold}>{accuracy.lengthFrontCm} cm</Text>
              </Text>
              <Text style={styles.axisSubValue}>
                Top View: <Text style={styles.axisValueBold}>{accuracy.lengthTopCm} cm</Text>
              </Text>
            </View>
          </View>

          {/* Breadth comparison (Side vs Top) */}
          <View style={[styles.matrixItem, { borderBottomWidth: 0 }]}>
            <View style={styles.axisLabelRow}>
              <Text style={styles.axisName}>Breadth / Width (W)</Text>
              <View
                style={[
                  styles.varBadge,
                  accuracy.breadthVarianceCm <= 1.5 ? styles.varBadgePass : styles.varBadgeFail,
                ]}
              >
                <Text
                  style={[
                    styles.varBadgeText,
                    accuracy.breadthVarianceCm <= 1.5
                      ? styles.varBadgeTextPass
                      : styles.varBadgeTextFail,
                  ]}
                >
                  Δ {accuracy.breadthVarianceCm.toFixed(1)} cm
                </Text>
              </View>
            </View>

            <View style={styles.axisValuesRow}>
              <Text style={styles.axisSubValue}>
                Side View: <Text style={styles.axisValueBold}>{accuracy.breadthSideCm} cm</Text>
              </Text>
              <Text style={styles.axisSubValue}>
                Top View: <Text style={styles.axisValueBold}>{accuracy.breadthTopCm} cm</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-angle Snapshot Thumbnails */}
        <View style={styles.thumbnailsSection}>
          <Text style={styles.matrixHeader}>CAPTURED OPTICAL PERSPECTIVES</Text>
          <View style={styles.thumbsRow}>
            <View style={styles.thumbCard}>
              {frontData.imageUri ? (
                <Image source={{ uri: frontData.imageUri }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.thumbLabel}>1. Front</Text>
            </View>

            <View style={styles.thumbCard}>
              {sideData.imageUri ? (
                <Image source={{ uri: sideData.imageUri }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.thumbLabel}>2. Side</Text>
            </View>

            <View style={styles.thumbCard}>
              {topData.imageUri ? (
                <Image source={{ uri: topData.imageUri }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.thumbLabel}>3. Top</Text>
            </View>
          </View>
        </View>

        {/* Calculated Dimensions Preview */}
        <View style={styles.dimCard}>
          <Text style={styles.matrixHeader}>CALCULATED PARCEL DIMENSIONS</Text>
          <View style={styles.dimValuesRow}>
            <View style={styles.dimCol}>
              <Text style={styles.dimKey}>Length (L)</Text>
              <Text style={styles.dimVal}>{dimensions.lengthCm.toFixed(1)} cm</Text>
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.dimKey}>Breadth (W)</Text>
              <Text style={styles.dimVal}>{dimensions.breadthCm.toFixed(1)} cm</Text>
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.dimKey}>Height (H)</Text>
              <Text style={styles.dimVal}>{dimensions.heightCm.toFixed(1)} cm</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Action Bar */}
      <View style={styles.footer}>
        {accuracy.isAccurate ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleProceedToResults}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>View Verified Results</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.charcoal} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ) : (
          <View style={styles.failButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleRetakeAll}
            >
              <Ionicons name="refresh" size={16} color={Colors.charcoal} style={{ marginRight: 4 }} />
              <Text style={styles.secondaryBtnText}>Measure Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualFallbackBtn}
              onPress={() =>
                navigation.navigate('ManualMeasure', {
                  initialDimensions: {
                    lengthCm: dimensions.lengthCm,
                    breadthCm: dimensions.breadthCm,
                    heightCm: dimensions.heightCm,
                  },
                })
              }
            >
              <Ionicons name="create-outline" size={16} color={Colors.charcoal} style={{ marginRight: 4 }} />
              <Text style={styles.manualFallbackBtnText}>Manual Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  statusExplainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  explainerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 6,
  },
  explainerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  matrixCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  matrixHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  matrixItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  axisLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  axisName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  varBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  varBadgePass: {
    backgroundColor: Colors.successLight,
  },
  varBadgeFail: {
    backgroundColor: Colors.dangerLight,
  },
  varBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  varBadgeTextPass: {
    color: Colors.success,
  },
  varBadgeTextFail: {
    color: Colors.danger,
  },
  axisValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisSubValue: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  axisValueBold: {
    fontWeight: '700',
    color: Colors.charcoal,
  },
  thumbnailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbCard: {
    flex: 1,
    alignItems: 'center',
  },
  thumbImg: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
  },
  thumbPlaceholder: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 4,
  },
  dimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  dimValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  dimCol: {
    alignItems: 'center',
  },
  dimKey: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  dimVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  failButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  manualFallbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    ...Shadows.card,
  },
  manualFallbackBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
  },
});

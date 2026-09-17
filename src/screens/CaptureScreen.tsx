import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { CameraViewport } from '../components/CameraViewport';
import { CornerPinEditor } from '../components/CornerPinEditor';
import {
  AngleCaptureData,
  CaptureAngle,
  ReferenceType,
  QuadCorners,
} from '../types';
import { REFERENCE_OBJECTS } from '../utils/measurementEngine';

interface CaptureScreenProps {
  route: any;
  navigation: any;
}

const ANGLE_CONFIGS: Record<
  CaptureAngle,
  {
    stepIndex: number;
    title: string;
    subtitle: string;
    primaryAxis: string;
    secondaryAxis: string;
    instructions: string;
    nextAngle: CaptureAngle | null;
  }
> = {
  front: {
    stepIndex: 1,
    title: 'Front View',
    subtitle: 'Measures Length & Height',
    primaryAxis: 'Length (L)',
    secondaryAxis: 'Height (H)',
    instructions:
      'Face parcel front on. Place reference card flat against bottom edge. Hold phone parallel.',
    nextAngle: 'side',
  },
  side: {
    stepIndex: 2,
    title: 'Side View',
    subtitle: 'Measures Breadth & Height',
    primaryAxis: 'Breadth (W)',
    secondaryAxis: 'Height (H)',
    instructions:
      'Rotate to parcel side. Keep reference card on the same plane next to side face.',
    nextAngle: 'top',
  },
  top: {
    stepIndex: 3,
    title: 'Top View',
    subtitle: 'Measures Length & Breadth',
    primaryAxis: 'Length (L)',
    secondaryAxis: 'Breadth (W)',
    instructions:
      'Look straight down at the parcel top surface. Place reference card flat on top surface.',
    nextAngle: null,
  },
};

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ route, navigation }) => {
  const referenceType: ReferenceType = route.params?.referenceType || 'iso_card';
  const refObj = REFERENCE_OBJECTS[referenceType];

  const [currentAngle, setCurrentAngle] = useState<CaptureAngle>('front');
  const [isLiveCamera, setIsLiveCamera] = useState<boolean>(true);

  // Store multi-angle data
  const [capturedData, setCapturedData] = useState<Record<CaptureAngle, AngleCaptureData | null>>({
    front: null,
    side: null,
    top: null,
  });

  // Current active angle draft in corner pin editor
  const [activeDraft, setActiveDraft] = useState<{
    imageUri: string | null;
    parcelCorners?: QuadCorners;
    refCorners?: QuadCorners;
    pixelsPerMm: number;
    primaryMm: number;
    secondaryMm: number;
    isValid: boolean;
    scaleReason?: string;
  }>({
    imageUri: null,
    pixelsPerMm: 0,
    primaryMm: 0,
    secondaryMm: 0,
    isValid: false,
  });

  const config = ANGLE_CONFIGS[currentAngle];

  const handlePictureTaken = (uri: string) => {
    setActiveDraft((prev) => ({
      ...prev,
      imageUri: uri,
    }));
    setIsLiveCamera(false);
  };

  const handleRetake = () => {
    setIsLiveCamera(true);
  };

  const handleCancelCapture = () => {
    const confirmMsg = 'Cancel parcel measurement and return to home?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        navigation.navigate('Home');
      }
    } else {
      Alert.alert('Cancel Measurement', confirmMsg, [
        { text: 'Continue Measuring', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => navigation.navigate('Home') },
      ]);
    }
  };

  const handleContinueNext = () => {
    // Check if scale is valid
    if (!activeDraft.isValid || activeDraft.primaryMm <= 0 || activeDraft.secondaryMm <= 0) {
      const reason =
        activeDraft.scaleReason ||
        'Reference card or parcel corners must be aligned to establish valid physical scale.';

      if (Platform.OS === 'web') {
        alert(reason);
      } else {
        Alert.alert('Optical Calibration Required', reason, [{ text: 'OK' }]);
      }
      return;
    }

    const angleData: AngleCaptureData = {
      angle: currentAngle,
      title: config.title,
      subtitle: config.subtitle,
      imageUri: activeDraft.imageUri,
      parcelCorners: activeDraft.parcelCorners || {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 250, y: 50 },
        bottomRight: { x: 250, y: 220 },
        bottomLeft: { x: 50, y: 220 },
      },
      referenceCorners: activeDraft.refCorners || {
        topLeft: { x: 30, y: 240 },
        topRight: { x: 130, y: 240 },
        bottomRight: { x: 130, y: 300 },
        bottomLeft: { x: 30, y: 300 },
      },
      pixelsPerMm: activeDraft.pixelsPerMm,
      calculatedPrimaryMm: activeDraft.primaryMm,
      calculatedSecondaryMm: activeDraft.secondaryMm,
      isCalibrated: true,
      lightingQuality: 'good',
      timestamp: Date.now(),
    };

    const updatedData = {
      ...capturedData,
      [currentAngle]: angleData,
    };
    setCapturedData(updatedData);

    if (config.nextAngle) {
      // Advance to next angle
      setCurrentAngle(config.nextAngle);
      setIsLiveCamera(true);
      setActiveDraft({
        imageUri: null,
        pixelsPerMm: 0,
        primaryMm: 0,
        secondaryMm: 0,
        isValid: false,
      });
    } else {
      // Completed all 3 angles! Proceed to validation
      navigation.navigate('AccuracyValidation', {
        referenceType,
        frontData: updatedData.front,
        sideData: updatedData.side,
        topData: angleData,
      });
    }
  };

  return (
    <View style={styles.container}>
      {isLiveCamera ? (
        <CameraViewport
          referenceType={referenceType}
          angleTitle={`Step ${config.stepIndex}/3: ${config.title}`}
          instructions={config.instructions}
          onPictureTaken={handlePictureTaken}
          onCancel={handleCancelCapture}
        />
      ) : (
        <View style={styles.reviewContainer}>
          <Header
            title={`${config.title} Edge Refinement`}
            subtitle={`Step ${config.stepIndex} of 3 • Align parcel & ${refObj.shortName}`}
            onBack={handleRetake}
            stepInfo={{
              current: config.stepIndex,
              total: 3,
              label: `${config.title} Verification`,
            }}
          />

          <ScrollView
            contentContainerStyle={styles.scrollReview}
            showsVerticalScrollIndicator={false}
          >
            {/* Corner Pin Quad Editor */}
            <CornerPinEditor
              imageUri={activeDraft.imageUri}
              referenceType={referenceType}
              primaryAxisLabel={config.primaryAxis}
              secondaryAxisLabel={config.secondaryAxis}
              onCornersChanged={(data) => {
                setActiveDraft((prev) => ({
                  ...prev,
                  parcelCorners: data.parcelCorners,
                  refCorners: data.refCorners,
                  pixelsPerMm: data.pixelsPerMm,
                  primaryMm: data.primaryMm,
                  secondaryMm: data.secondaryMm,
                  isValid: data.isValid,
                  scaleReason: data.scaleReason,
                }));
              }}
            />

            {/* Step-by-Step Multi-Angle Capture Progress */}
            <View style={styles.progressCard}>
              <Text style={styles.progressCardTitle}>CAPTURE PROGRESS (3 ANGLES)</Text>
              <View style={styles.progressStepsRow}>
                <View
                  style={[
                    styles.stepBadgeItem,
                    currentAngle === 'front'
                      ? styles.stepBadgeActive
                      : capturedData.front
                      ? styles.stepBadgeCompleted
                      : styles.stepBadgePending,
                  ]}
                >
                  <Ionicons
                    name={
                      capturedData.front
                        ? 'checkmark'
                        : currentAngle === 'front'
                        ? 'radio-button-on'
                        : 'ellipse-outline'
                    }
                    size={14}
                    color={currentAngle === 'front' ? Colors.charcoal : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.stepBadgeText,
                      currentAngle === 'front' && styles.stepBadgeTextActive,
                    ]}
                  >
                    1. Front
                  </Text>
                </View>

                <View style={styles.stepConnectorLine} />

                <View
                  style={[
                    styles.stepBadgeItem,
                    currentAngle === 'side'
                      ? styles.stepBadgeActive
                      : capturedData.side
                      ? styles.stepBadgeCompleted
                      : styles.stepBadgePending,
                  ]}
                >
                  <Ionicons
                    name={
                      capturedData.side
                        ? 'checkmark'
                        : currentAngle === 'side'
                        ? 'radio-button-on'
                        : 'ellipse-outline'
                    }
                    size={14}
                    color={currentAngle === 'side' ? Colors.charcoal : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.stepBadgeText,
                      currentAngle === 'side' && styles.stepBadgeTextActive,
                    ]}
                  >
                    2. Side
                  </Text>
                </View>

                <View style={styles.stepConnectorLine} />

                <View
                  style={[
                    styles.stepBadgeItem,
                    currentAngle === 'top'
                      ? styles.stepBadgeActive
                      : capturedData.top
                      ? styles.stepBadgeCompleted
                      : styles.stepBadgePending,
                  ]}
                >
                  <Ionicons
                    name={
                      capturedData.top
                        ? 'checkmark'
                        : currentAngle === 'top'
                        ? 'radio-button-on'
                        : 'ellipse-outline'
                    }
                    size={14}
                    color={currentAngle === 'top' ? Colors.charcoal : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.stepBadgeText,
                      currentAngle === 'top' && styles.stepBadgeTextActive,
                    ]}
                  >
                    3. Top
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer: Retake & Continue */}
          <View style={styles.reviewFooter}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Ionicons name="refresh" size={18} color={Colors.charcoal} style={{ marginRight: 6 }} />
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                !activeDraft.isValid && styles.continueBtnDisabled,
              ]}
              onPress={handleContinueNext}
            >
              <Text style={styles.continueBtnText}>
                {config.nextAngle ? `Continue to ${ANGLE_CONFIGS[config.nextAngle].title}` : 'Calculate Dimensions'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.charcoal} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollReview: {
    padding: 16,
    paddingBottom: 24,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    ...Shadows.subtle,
  },
  progressCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  progressStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  stepBadgeActive: {
    backgroundColor: Colors.primary,
  },
  stepBadgeCompleted: {
    backgroundColor: Colors.charcoal,
  },
  stepBadgePending: {
    backgroundColor: Colors.surfaceSubtle,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  stepBadgeTextActive: {
    color: Colors.charcoal,
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  reviewFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  continueBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.card,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
  },
});

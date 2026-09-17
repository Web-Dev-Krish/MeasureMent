import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';

interface HowItWorksScreenProps {
  navigation: any;
}

export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="How Parcel Measure Works"
        subtitle="Logistics-grade optical calibration & geometry"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Principle Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.charcoal} />
            <Text style={styles.badgeText}>ZERO SIMULATED MEASUREMENTS POLICY</Text>
          </View>
          <Text style={styles.cardTitle}>Why We Calibrate with a Real Object</Text>
          <Text style={styles.cardDesc}>
            Standard phone cameras are 2D monocular sensors. Without a physical reference or specialized dual ToF/LiDAR sensors, a phone camera cannot discern whether an object is a small box close up or a giant container far away.
          </Text>
          <Text style={styles.cardDesc}>
            Parcel Measure uses internationally standardized objects—such as an ISO/IEC 7810 ID-1 card (standard credit/debit card, exactly 85.60 × 53.98 mm)—to establish true ground-truth pixel-to-millimeter scale.
          </Text>
        </View>

        {/* Step-by-Step Flow */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>THE 4-STEP MEASUREMENT PIPELINE</Text>

          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Optical Calibration Marker</Text>
              <Text style={styles.stepText}>
                Place your standard ID or bank card flat beside the parcel on the exact same plane. The system calculates pixels-per-millimeter scale.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Multi-Angle Capture (Front, Side, Top)</Text>
              <Text style={styles.stepText}>
                Three distinct perspectives are captured to measure Length & Height (Front), Breadth & Height (Side), and Length & Breadth (Top).
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Cross-Axis Triangulation Validation</Text>
              <Text style={styles.stepText}>
                Shared axes are compared across captures (e.g. Height Front vs Height Side). If variance is within ±0.4 cm, the measurement is certified.
              </Text>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>4</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Volumetric & Scale Weight Billing</Text>
              <Text style={styles.stepText}>
                Computes IATA volumetric weight ((L × W × H) / 5000). The user inputs actual scale weight, establishing accurate billable freight weight.
              </Text>
            </View>
          </View>
        </View>

        {/* Best Practices Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>PRO TIPS FOR HIGHEST PRECISION</Text>

          <View style={styles.tipRow}>
            <Ionicons name="sunny-outline" size={18} color={Colors.primaryDark} style={{ marginRight: 8 }} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Even Lighting: </Text>
              Avoid heavy direct shadows that blur parcel edges.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={Colors.primaryDark} style={{ marginRight: 8 }} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Hold Phone Parallel: </Text>
              Facing directly perpendicular minimizes perspective keystone distortion.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="locate-outline" size={18} color={Colors.primaryDark} style={{ marginRight: 8 }} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Magnifier Loupe: </Text>
              Use the built-in 2x zoom loupe in the corner editor to align vertices to the exact edge pixels.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.primaryDark} style={{ marginRight: 8 }} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>100% On-Device Privacy: </Text>
              Images never leave your smartphone.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CalibrationSetup')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Start Measurement</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.charcoal} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  stepText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  tipBold: {
    fontWeight: '700',
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
});

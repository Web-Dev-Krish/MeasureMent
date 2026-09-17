import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { Parcel3DView } from '../components/Parcel3DView';
import { AccuracyBadge } from '../components/AccuracyBadge';
import {
  calculateBillableWeight,
  calculateVolumetricWeight,
} from '../utils/measurementEngine';

interface ManualMeasureScreenProps {
  route: any;
  navigation: any;
}

export const ManualMeasureScreen: React.FC<ManualMeasureScreenProps> = ({ route, navigation }) => {
  const initial = route.params?.initialDimensions || {};

  const [lengthInput, setLengthInput] = useState<string>(initial.lengthCm ? initial.lengthCm.toString() : '30');
  const [breadthInput, setBreadthInput] = useState<string>(initial.breadthCm ? initial.breadthCm.toString() : '20');
  const [heightInput, setHeightInput] = useState<string>(initial.heightCm ? initial.heightCm.toString() : '15');
  const [weightInput, setWeightInput] = useState<string>(initial.weightKg ? initial.weightKg.toString() : '');
  const [titleInput, setTitleInput] = useState<string>('Manual Parcel');

  const parsedL = parseFloat(lengthInput) || 0;
  const parsedB = parseFloat(breadthInput) || 0;
  const parsedH = parseFloat(heightInput) || 0;
  const parsedWeight = parseFloat(weightInput) || null;

  const volWeight = calculateVolumetricWeight(parsedL, parsedB, parsedH);
  const billableWeight = calculateBillableWeight(parsedWeight, volWeight);
  const volumeCm3 = Math.round(parsedL * parsedB * parsedH);

  const handleContinue = () => {
    if (parsedL <= 0 || parsedB <= 0 || parsedH <= 0) {
      if (Platform.OS === 'web') {
        alert('Please enter valid positive dimensions for Length, Breadth, and Height.');
      } else {
        Alert.alert('Invalid Dimensions', 'Length, Breadth, and Height must be greater than zero.');
      }
      return;
    }

    navigation.replace('Result', {
      dimensions: {
        lengthCm: parsedL,
        breadthCm: parsedB,
        heightCm: parsedH,
        volumeCm3,
        volumetricWeightKg: volWeight,
      },
      accuracy: {
        isAccurate: true,
        toleranceCm: 0,
        confidencePercentage: 100,
        heightFrontCm: parsedH,
        heightSideCm: parsedH,
        lengthFrontCm: parsedL,
        lengthTopCm: parsedL,
        breadthSideCm: parsedB,
        breadthTopCm: parsedB,
        heightVarianceCm: 0,
        lengthVarianceCm: 0,
        breadthVarianceCm: 0,
        lightingRating: 'good',
        scalePresenceDetected: false,
        validationStatus: 'manual_verified',
        statusMessage: 'Manually verified physical dimensions.',
      },
      isManual: true,
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Manual Parcel Measurement"
        subtitle="Direct input for non-camera or verified workflows"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status */}
        <AccuracyBadge status="manual_verified" />

        {/* Live 3D Box Model dynamically scaling to inputs */}
        <Parcel3DView
          lengthCm={parsedL}
          breadthCm={parsedB}
          heightCm={parsedH}
          interactive
        />

        {/* Dimension Fields */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>PHYSICAL DIMENSIONS (TAPE MEASURE)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Parcel Label / Name</Text>
            <TextInput
              style={styles.textInput}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="e.g. Electronics Box"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.threeColRow}>
            <View style={styles.colItem}>
              <Text style={styles.inputLabel}>Length (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={lengthInput}
                onChangeText={setLengthInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.colItem}>
              <Text style={styles.inputLabel}>Breadth (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={breadthInput}
                onChangeText={setBreadthInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.colItem}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={heightInput}
                onChangeText={setHeightInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Weighing scale input */}
        <View style={styles.formCard}>
          <View style={styles.weightHeaderRow}>
            <View style={styles.weightIconBox}>
              <Ionicons name="scale" size={20} color={Colors.charcoal} />
            </View>
            <View style={styles.weightCol}>
              <Text style={styles.formCardTitle}>PHYSICAL SCALE WEIGHT</Text>
              <Text style={styles.weightSubtitle}>Read directly from weighing scale</Text>
            </View>
          </View>

          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightTextInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder="e.g. 5.50"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>KG</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Volume</Text>
              <Text style={styles.summaryVal}>{volumeCm3.toLocaleString()} cm³</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Volumetric Wt</Text>
              <Text style={styles.summaryVal}>{volWeight.toFixed(2)} kg</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Billable Freight</Text>
              <Text style={[styles.summaryVal, { color: Colors.primaryDark }]}>
                {billableWeight.toFixed(2)} kg
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Continue */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Confirm Manual Measurement</Text>
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  formCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colItem: {
    flex: 1,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weightIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  weightCol: {
    flex: 1,
  },
  weightSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  weightTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    paddingVertical: 10,
  },
  unitBadge: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 10,
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
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

import React, { useState } from 'react';
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
import { ReferenceSelector } from '../components/ReferenceSelector';
import { ReferenceType } from '../types';
import { REFERENCE_OBJECTS } from '../utils/measurementEngine';

interface CalibrationScreenProps {
  navigation: any;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({ navigation }) => {
  const [selectedRef, setSelectedRef] = useState<ReferenceType>('iso_card');

  const refObj = REFERENCE_OBJECTS[selectedRef];

  return (
    <View style={styles.container}>
      <Header
        title="Optical Calibration"
        subtitle="Establish physical real-world scale"
        onBack={() => navigation.goBack()}
        stepInfo={{ current: 1, total: 4, label: 'Reference Calibration' }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReferenceSelector
          selected={selectedRef}
          onSelect={(type) => setSelectedRef(type)}
        />

        {/* Real-world Geometry Principles */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesHeader}>CALIBRATION RULES FOR ACCURACY</Text>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconBox}>
              <Text style={styles.ruleNumber}>1</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>Place on the Same Plane</Text>
              <Text style={styles.ruleDesc}>
                Place the {refObj.shortName} flat on the table or against the base of the parcel face. If depth varies, optical scale will differ.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconBox}>
              <Text style={styles.ruleNumber}>2</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>Keep Phone Parallel</Text>
              <Text style={styles.ruleDesc}>
                Hold phone straight facing the parcel box. Severe angle tilts induce perspective skew which reduces millimeter precision.
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIconBox}>
              <Text style={styles.ruleNumber}>3</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>Capture All 3 Angles</Text>
              <Text style={styles.ruleDesc}>
                You will capture Front (Length & Height), Side (Breadth & Height), and Top (Length & Breadth) to independently cross-verify each dimension.
              </Text>
            </View>
          </View>
        </View>

        {/* Anti-Fake Measurement Notice */}
        <View style={styles.antiFakeBox}>
          <Ionicons name="information-circle" size={18} color={Colors.charcoal} style={{ marginRight: 8 }} />
          <Text style={styles.antiFakeText}>
            Parcel Measure enforces zero simulated or random measurements. Every millimeter is derived strictly from optical pinhole geometry and verified reference markers.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Continue Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('MultiAngleCapture', {
              referenceType: selectedRef,
            })
          }
        >
          <Text style={styles.primaryBtnText}>
            Continue with {refObj.shortName}
          </Text>
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
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  rulesHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  ruleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  ruleNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  antiFakeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  antiFakeText: {
    fontSize: 11,
    color: Colors.charcoal,
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
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

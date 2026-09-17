import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface AccuracyBadgeProps {
  status: 'verified' | 'discrepancy_detected' | 'uncalibrated' | 'manual_verified';
  toleranceCm?: number;
  confidenceScore?: number;
  compact?: boolean;
}

export const AccuracyBadge: React.FC<AccuracyBadgeProps> = ({
  status,
  toleranceCm = 0.4,
  confidenceScore = 95,
  compact = false,
}) => {
  let bgColor = Colors.successLight;
  let borderColor = '#A7F3D0';
  let iconName: keyof typeof Ionicons.glyphMap = 'shield-checkmark';
  let iconColor = Colors.success;
  let title = 'Measurement verified within supported tolerance';
  let subtitle = `Calibrated optical accuracy (±${toleranceCm.toFixed(1)} cm)`;

  if (status === 'manual_verified') {
    bgColor = '#FEF3C7';
    borderColor = '#FDE68A';
    iconName = 'create-outline';
    iconColor = '#D97706';
    title = 'Manually Verified';
    subtitle = 'User manually edited/confirmed physical dimensions';
  } else if (status === 'discrepancy_detected') {
    bgColor = Colors.dangerLight;
    borderColor = '#FECACA';
    iconName = 'alert-circle';
    iconColor = Colors.danger;
    title = 'Discrepancy Detected';
    subtitle = 'Camera angle variance exceeds verified tolerance';
  } else if (status === 'uncalibrated') {
    bgColor = Colors.warningLight;
    borderColor = '#FDE68A';
    iconName = 'warning-outline';
    iconColor = Colors.warning;
    title = 'Uncalibrated Scale';
    subtitle = 'Standard reference card scale missing';
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bgColor, borderColor }]}>
        <Ionicons name={iconName} size={14} color={iconColor} />
        <Text style={[styles.compactText, { color: iconColor }]}>
          {status === 'verified'
            ? 'Verified (±0.4cm)'
            : status === 'manual_verified'
            ? 'Manually Verified'
            : 'Check Scale'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.iconWrapper, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
          {status === 'verified' && confidenceScore > 0 && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{confidenceScore}% CONF</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  scorePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  scoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.charcoalSoft,
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

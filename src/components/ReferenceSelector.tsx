import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { ReferenceType } from '../types';
import { REFERENCE_OBJECTS } from '../utils/measurementEngine';

interface ReferenceSelectorProps {
  selected: ReferenceType;
  onSelect: (type: ReferenceType) => void;
}

export const ReferenceSelector: React.FC<ReferenceSelectorProps> = ({ selected, onSelect }) => {
  const references: ReferenceType[] = ['iso_card', 'a4_paper', 'ruler_10cm'];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Physical Optical Reference Standard</Text>
      <Text style={styles.sectionSubtitle}>
        Computer vision relies on a real, known object on the same plane to calibrate millimeter scale without guessing.
      </Text>

      <View style={styles.list}>
        {references.map((type) => {
          const item = REFERENCE_OBJECTS[type];
          const isSelected = selected === type;

          return (
            <TouchableOpacity
              key={type}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(type)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <Ionicons
                  name={item.iconName as any}
                  size={24}
                  color={isSelected ? Colors.charcoal : Colors.textSecondary}
                />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {item.name}
                  </Text>
                  {type === 'iso_card' && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recText}>RECOMMENDED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.dimText}>
                  Standard Size: {item.widthMm} × {item.heightMm} mm
                </Text>
                <Text style={styles.descText}>{item.description}</Text>
              </View>

              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFDF5',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxSelected: {
    backgroundColor: Colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  cardTitleSelected: {
    color: Colors.charcoal,
  },
  recBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: 0.4,
  },
  dimText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.charcoalSoft,
    marginBottom: 2,
  },
  descText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: Colors.primaryDark,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryDark,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Polygon, Line, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Point2D, QuadCorners, ReferenceType } from '../types';
import {
  calculateReferenceScale,
  calculateParcelFaceDimensionsMm,
  REFERENCE_OBJECTS,
} from '../utils/measurementEngine';
import { Ionicons } from '@expo/vector-icons';

interface CornerPinEditorProps {
  imageUri: string | null;
  referenceType: ReferenceType;
  initialParcelCorners?: QuadCorners;
  initialRefCorners?: QuadCorners;
  primaryAxisLabel: string; // e.g. "Length" or "Breadth"
  secondaryAxisLabel: string; // e.g. "Height"
  onCornersChanged: (data: {
    parcelCorners: QuadCorners;
    refCorners: QuadCorners;
    pixelsPerMm: number;
    primaryMm: number;
    secondaryMm: number;
    isValid: boolean;
    scaleReason?: string;
  }) => void;
}

export const CornerPinEditor: React.FC<CornerPinEditorProps> = ({
  imageUri,
  referenceType,
  initialParcelCorners,
  initialRefCorners,
  primaryAxisLabel,
  secondaryAxisLabel,
  onCornersChanged,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const canvasWidth = Math.min(screenWidth - 32, 420);
  const canvasHeight = Math.round(canvasWidth * 1.05);

  // Default quadrilateral coordinates for parcel (main box)
  const defaultParcel: QuadCorners = initialParcelCorners || {
    topLeft: { x: canvasWidth * 0.2, y: canvasHeight * 0.18 },
    topRight: { x: canvasWidth * 0.8, y: canvasHeight * 0.18 },
    bottomRight: { x: canvasWidth * 0.8, y: canvasHeight * 0.72 },
    bottomLeft: { x: canvasWidth * 0.2, y: canvasHeight * 0.72 },
  };

  // Default quadrilateral coordinates for reference card (placed near bottom)
  const refObj = REFERENCE_OBJECTS[referenceType];
  const refWidth = canvasWidth * 0.26;
  const refHeight = refWidth / refObj.aspectRatio;

  const defaultRef: QuadCorners = initialRefCorners || {
    topLeft: { x: canvasWidth * 0.08, y: canvasHeight * 0.78 },
    topRight: { x: canvasWidth * 0.08 + refWidth, y: canvasHeight * 0.78 },
    bottomRight: { x: canvasWidth * 0.08 + refWidth, y: canvasHeight * 0.78 + refHeight },
    bottomLeft: { x: canvasWidth * 0.08, y: canvasHeight * 0.78 + refHeight },
  };

  const [parcelCorners, setParcelCorners] = useState<QuadCorners>(defaultParcel);
  const [refCorners, setRefCorners] = useState<QuadCorners>(defaultRef);
  const [activeTarget, setActiveTarget] = useState<'parcel' | 'reference'>('parcel');
  const [activeCorner, setActiveCorner] = useState<keyof QuadCorners | null>(null);
  const [touchPos, setTouchPos] = useState<Point2D | null>(null);

  // Compute live calculations
  const scaleResult = calculateReferenceScale(referenceType, refCorners);
  const parcelResult = calculateParcelFaceDimensionsMm(
    parcelCorners,
    scaleResult.pixelsPerMmW || scaleResult.pixelsPerMm || 1,
    scaleResult.pixelsPerMmH || scaleResult.pixelsPerMm || 1
  );

  const notifyUpdate = (newParcel: QuadCorners, newRef: QuadCorners) => {
    const sc = calculateReferenceScale(referenceType, newRef);
    const pr = calculateParcelFaceDimensionsMm(
      newParcel,
      sc.pixelsPerMmW || sc.pixelsPerMm || 1,
      sc.pixelsPerMmH || sc.pixelsPerMm || 1
    );

    onCornersChanged({
      parcelCorners: newParcel,
      refCorners: newRef,
      pixelsPerMm: sc.pixelsPerMm,
      primaryMm: pr.widthMm,
      secondaryMm: pr.heightMm,
      isValid: sc.isValid && pr.isValid,
      scaleReason: sc.reason || pr.reason,
    });
  };

  // Draggable handle touch responder
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setTouchPos({ x: locationX, y: locationY });

      // Determine nearest corner handle
      const targetCorners = activeTarget === 'parcel' ? parcelCorners : refCorners;
      let closestKey: keyof QuadCorners = 'topLeft';
      let minDist = 999999;

      (['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as (keyof QuadCorners)[]).forEach(
        (key) => {
          const pt = targetCorners[key];
          const dist = Math.hypot(pt.x - locationX, pt.y - locationY);
          if (dist < minDist) {
            minDist = dist;
            closestKey = key;
          }
        }
      );

      // Grab handle if within 50px or snap to closest
      setActiveCorner(closestKey);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      // Clamp within canvas boundaries
      const clampedX = Math.max(8, Math.min(canvasWidth - 8, locationX));
      const clampedY = Math.max(8, Math.min(canvasHeight - 8, locationY));

      setTouchPos({ x: clampedX, y: clampedY });

      if (activeCorner) {
        if (activeTarget === 'parcel') {
          const updated = {
            ...parcelCorners,
            [activeCorner]: { x: clampedX, y: clampedY },
          };
          setParcelCorners(updated);
          notifyUpdate(updated, refCorners);
        } else {
          const updated = {
            ...refCorners,
            [activeCorner]: { x: clampedX, y: clampedY },
          };
          setRefCorners(updated);
          notifyUpdate(parcelCorners, updated);
        }
      }
    },
    onPanResponderRelease: () => {
      setActiveCorner(null);
      setTouchPos(null);
    },
    onPanResponderTerminate: () => {
      setActiveCorner(null);
      setTouchPos(null);
    },
  });

  // Fine adjust single axis
  const nudge = (dx: number, dy: number) => {
    if (!activeCorner) return;
    if (activeTarget === 'parcel') {
      const current = parcelCorners[activeCorner];
      const updated = {
        ...parcelCorners,
        [activeCorner]: {
          x: Math.max(8, Math.min(canvasWidth - 8, current.x + dx)),
          y: Math.max(8, Math.min(canvasHeight - 8, current.y + dy)),
        },
      };
      setParcelCorners(updated);
      notifyUpdate(updated, refCorners);
    } else {
      const current = refCorners[activeCorner];
      const updated = {
        ...refCorners,
        [activeCorner]: {
          x: Math.max(8, Math.min(canvasWidth - 8, current.x + dx)),
          y: Math.max(8, Math.min(canvasHeight - 8, current.y + dy)),
        },
      };
      setRefCorners(updated);
      notifyUpdate(parcelCorners, updated);
    }
  };

  const resetCorners = () => {
    setParcelCorners(defaultParcel);
    setRefCorners(defaultRef);
    notifyUpdate(defaultParcel, defaultRef);
  };

  return (
    <View style={styles.container}>
      {/* Target selector tabs */}
      <View style={styles.targetBar}>
        <TouchableOpacity
          style={[styles.targetTab, activeTarget === 'parcel' && styles.targetTabActiveParcel]}
          onPress={() => {
            setActiveTarget('parcel');
            setActiveCorner('topLeft');
          }}
        >
          <View style={[styles.targetDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.targetTabText, activeTarget === 'parcel' && styles.targetTabTextActive]}>
            Parcel Edge Pins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.targetTab, activeTarget === 'reference' && styles.targetTabActiveRef]}
          onPress={() => {
            setActiveTarget('reference');
            setActiveCorner('topLeft');
          }}
        >
          <View style={[styles.targetDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.targetTabText, activeTarget === 'reference' && styles.targetTabTextActive]}>
            Ref Card Scale Pins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Interactive Canvas Area */}
      <View
        style={[styles.canvasWrapper, { width: canvasWidth, height: canvasHeight }]}
        {...panResponder.panHandlers}
      >
        {/* Real photo if captured, otherwise clean calibrated grid */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.capturedImage, { width: canvasWidth, height: canvasHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridBg}>
            <View style={styles.gridOverlay} />
          </View>
        )}

        {/* SVG Overlay for polygons and handles */}
        <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
          {/* Reference Card Quad */}
          <Polygon
            points={`
              ${refCorners.topLeft.x},${refCorners.topLeft.y}
              ${refCorners.topRight.x},${refCorners.topRight.y}
              ${refCorners.bottomRight.x},${refCorners.bottomRight.y}
              ${refCorners.bottomLeft.x},${refCorners.bottomLeft.y}
            `}
            fill="rgba(59, 130, 246, 0.22)"
            stroke="#2563EB"
            strokeWidth={activeTarget === 'reference' ? 2.5 : 1.5}
            strokeDasharray={activeTarget === 'reference' ? undefined : '4,3'}
          />

          {/* Reference Card Label */}
          <Rect
            x={(refCorners.topLeft.x + refCorners.bottomRight.x) / 2 - 42}
            y={(refCorners.topLeft.y + refCorners.bottomRight.y) / 2 - 9}
            width="84"
            height="18"
            rx="4"
            fill="#1E40AF"
            opacity="0.9"
          />
          <SvgText
            x={(refCorners.topLeft.x + refCorners.bottomRight.x) / 2}
            y={(refCorners.topLeft.y + refCorners.bottomRight.y) / 2 + 4}
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {`REF: ${refObj.shortName}`}
          </SvgText>

          {/* Reference Corner Handles */}
          {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as (keyof QuadCorners)[]).map(
            (k) => (
              <Circle
                key={`ref-${k}`}
                cx={refCorners[k].x}
                cy={refCorners[k].y}
                r={activeTarget === 'reference' && activeCorner === k ? 14 : 9}
                fill={activeTarget === 'reference' ? '#3B82F6' : 'rgba(59, 130, 246, 0.6)'}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
            )
          )}

          {/* Parcel Quad */}
          <Polygon
            points={`
              ${parcelCorners.topLeft.x},${parcelCorners.topLeft.y}
              ${parcelCorners.topRight.x},${parcelCorners.topRight.y}
              ${parcelCorners.bottomRight.x},${parcelCorners.bottomRight.y}
              ${parcelCorners.bottomLeft.x},${parcelCorners.bottomLeft.y}
            `}
            fill="rgba(16, 185, 129, 0.15)"
            stroke={Colors.primaryDark}
            strokeWidth={activeTarget === 'parcel' ? 3 : 2}
          />

          {/* Parcel Center Label */}
          <Rect
            x={(parcelCorners.topLeft.x + parcelCorners.bottomRight.x) / 2 - 58}
            y={(parcelCorners.topLeft.y + parcelCorners.bottomRight.y) / 2 - 12}
            width="116"
            height="24"
            rx="6"
            fill="#14181F"
          />
          <SvgText
            x={(parcelCorners.topLeft.x + parcelCorners.bottomRight.x) / 2}
            y={(parcelCorners.topLeft.y + parcelCorners.bottomRight.y) / 2 + 4}
            fill="#FFBE1A"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            {`${primaryAxisLabel}: ${(parcelResult.widthMm / 10).toFixed(1)}cm | ${secondaryAxisLabel}: ${(
              parcelResult.heightMm / 10
            ).toFixed(1)}cm`}
          </SvgText>

          {/* Parcel Corner Handles */}
          {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as (keyof QuadCorners)[]).map(
            (k) => (
              <G key={`parcel-${k}`}>
                <Circle
                  cx={parcelCorners[k].x}
                  cy={parcelCorners[k].y}
                  r={activeTarget === 'parcel' && activeCorner === k ? 15 : 10}
                  fill={activeTarget === 'parcel' ? '#10B981' : 'rgba(16, 185, 129, 0.7)'}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
                {/* Inner dot */}
                <Circle
                  cx={parcelCorners[k].x}
                  cy={parcelCorners[k].y}
                  r="3.5"
                  fill="#14181F"
                />
              </G>
            )
          )}
        </Svg>

        {/* Loupe Magnifier above active touch */}
        {touchPos && activeCorner && (
          <View
            style={[
              styles.loupe,
              {
                left: Math.max(10, Math.min(canvasWidth - 80, touchPos.x - 38)),
                top: Math.max(10, touchPos.y - 88),
              },
            ]}
          >
            <View style={styles.loupeReticle}>
              <View style={styles.loupeCrossHorizontal} />
              <View style={styles.loupeCrossVertical} />
              <View style={styles.loupeCenterDot} />
            </View>
            <Text style={styles.loupeLabel}>{activeCorner.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Real-time Precision Live Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{primaryAxisLabel}</Text>
          <Text style={styles.statValue}>
            {(parcelResult.widthMm / 10).toFixed(1)}{' '}
            <Text style={styles.statUnit}>cm</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{secondaryAxisLabel}</Text>
          <Text style={styles.statValue}>
            {(parcelResult.heightMm / 10).toFixed(1)}{' '}
            <Text style={styles.statUnit}>cm</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Scale Factor</Text>
          <Text style={styles.statValue}>
            {scaleResult.pixelsPerMm > 0 ? scaleResult.pixelsPerMm.toFixed(2) : '0.00'}{' '}
            <Text style={styles.statUnit}>px/mm</Text>
          </Text>
        </View>
      </View>

      {/* Validation status warning if scale is distorted */}
      {!scaleResult.isValid && scaleResult.reason && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.warningText}>{scaleResult.reason}</Text>
        </View>
      )}

      {/* Micro-Adjustment D-Pad & Tools */}
      <View style={styles.toolRow}>
        <View style={styles.dpadGroup}>
          <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(0, -1)}>
            <Ionicons name="chevron-up" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
          <View style={styles.dpadHorizontal}>
            <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(-1, 0)}>
              <Ionicons name="chevron-back" size={18} color={Colors.charcoal} />
            </TouchableOpacity>
            <View style={styles.dpadCenter}>
              <Text style={styles.dpadCenterText}>1px</Text>
            </View>
            <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(1, 0)}>
              <Ionicons name="chevron-forward" size={18} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(0, 1)}>
            <Ionicons name="chevron-down" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionPill} onPress={resetCorners}>
            <Ionicons name="refresh" size={14} color={Colors.charcoal} style={{ marginRight: 4 }} />
            <Text style={styles.actionPillText}>Reset Pins</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            Tip: Drag corner circles directly onto item edges.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  targetBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: 8,
  },
  targetTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  targetTabActiveParcel: {
    backgroundColor: '#E8FDF3',
  },
  targetTabActiveRef: {
    backgroundColor: '#EFF6FF',
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  targetTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  targetTabTextActive: {
    color: Colors.charcoal,
  },
  canvasWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E242E',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  capturedImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A212D',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loupe: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(20, 24, 31, 0.95)',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  loupeReticle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loupeCrossHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: Colors.primary,
  },
  loupeCrossVertical: {
    position: 'absolute',
    height: '100%',
    width: 1.5,
    backgroundColor: Colors.primary,
  },
  loupeCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  loupeLabel: {
    position: 'absolute',
    bottom: 4,
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  warningText: {
    fontSize: 11,
    color: Colors.danger,
    flex: 1,
    fontWeight: '600',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  dpadGroup: {
    alignItems: 'center',
  },
  dpadHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dpadCenter: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadCenterText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  nudgeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flex: 1,
    marginLeft: 16,
    alignItems: 'flex-start',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  hintText: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
});

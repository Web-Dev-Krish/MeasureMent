import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { cmToInches } from '../utils/measurementEngine';

interface Parcel3DViewProps {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  unit?: 'metric' | 'imperial';
  interactive?: boolean;
}

export const Parcel3DView: React.FC<Parcel3DViewProps> = ({
  lengthCm,
  breadthCm,
  heightCm,
  unit = 'metric',
  interactive = true,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'ortho'>('3d');

  // Guard against non-positive dimensions
  const l = Math.max(5, lengthCm || 20);
  const b = Math.max(5, breadthCm || 15);
  const h = Math.max(5, heightCm || 10);

  // Normalization for isometric projection
  // Max dimension maps to ~130px in SVG canvas
  const maxDim = Math.max(l, b, h);
  const scale = 125 / maxDim;

  const isoL = Math.max(35, Math.min(160, l * scale));
  const isoB = Math.max(25, Math.min(120, b * scale));
  const isoH = Math.max(30, Math.min(140, h * scale));

  // Isometric projection angles (30 deg):
  // cos(30°) ≈ 0.866, sin(30°) ≈ 0.5
  const cos30 = 0.866;
  const sin30 = 0.5;

  // Center anchor point in 340x260 viewport
  const centerX = 160;
  const centerY = 145;

  // Front-bottom vertex (origin for 3D box)
  const p0 = { x: centerX - (isoL * cos30) / 2 + (isoB * cos30) / 4, y: centerY + isoH / 3 };

  // Bottom face vertices:
  // p1: bottom-right of front face (moves along L vector: -cos30, +sin30)
  // Let's standardise:
  // X axis (Length): down-left (-cos30, +sin30)
  // Z axis (Breadth/Depth): down-right (+cos30, +sin30)
  // Y axis (Height): straight up (0, -1)
  const origin = { x: centerX, y: centerY + isoH * 0.4 };

  const frontBottom = origin;
  const frontLeftBottom = { x: origin.x - isoL * cos30 * 0.7, y: origin.y - isoL * sin30 * 0.7 };
  const sideRightBottom = { x: origin.x + isoB * cos30 * 0.7, y: origin.y - isoB * sin30 * 0.7 };
  const backBottom = {
    x: frontLeftBottom.x + isoB * cos30 * 0.7,
    y: frontLeftBottom.y - isoB * sin30 * 0.7,
  };

  // Top vertices (shifted vertically up by -isoH)
  const frontTop = { x: frontBottom.x, y: frontBottom.y - isoH };
  const frontLeftTop = { x: frontLeftBottom.x, y: frontLeftBottom.y - isoH };
  const sideRightTop = { x: sideRightBottom.x, y: sideRightBottom.y - isoH };
  const backTop = { x: backBottom.x, y: backBottom.y - isoH };

  // Format labels
  const formatDim = (valCm: number) => {
    if (unit === 'imperial') {
      return `${cmToInches(valCm)} in`;
    }
    return `${valCm.toFixed(1)} cm`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.techTag}>
            <Ionicons name="cube" size={13} color={Colors.charcoal} style={{ marginRight: 4 }} />
            <Text style={styles.techTagText}>3D BOX MODEL</Text>
          </View>
          <Text style={styles.ratioText}>
            Ratio {l.toFixed(0)}:{b.toFixed(0)}:{h.toFixed(0)}
          </Text>
        </View>

        {interactive && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === '3d' && styles.toggleBtnActive]}
              onPress={() => setViewMode('3d')}
            >
              <Text style={[styles.toggleText, viewMode === '3d' && styles.toggleTextActive]}>
                Isometric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'ortho' && styles.toggleBtnActive]}
              onPress={() => setViewMode('ortho')}
            >
              <Text style={[styles.toggleText, viewMode === 'ortho' && styles.toggleTextActive]}>
                Projections
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {viewMode === '3d' ? (
        <View style={styles.svgContainer}>
          <Svg width="100%" height={230} viewBox="0 0 340 250">
            <Defs>
              <LinearGradient id="topFaceGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#EAD7B8" stopOpacity="1" />
                <Stop offset="1" stopColor="#DECAAB" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="leftFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#C9B390" stopOpacity="1" />
                <Stop offset="1" stopColor="#BFA885" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="rightFaceGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#A89270" stopOpacity="1" />
                <Stop offset="1" stopColor="#9C8666" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* Left face (Front / Length x Height) */}
            <Polygon
              points={`${frontLeftBottom.x},${frontLeftBottom.y} ${frontBottom.x},${frontBottom.y} ${frontTop.x},${frontTop.y} ${frontLeftTop.x},${frontLeftTop.y}`}
              fill="url(#leftFaceGrad)"
              stroke="#6B5C45"
              strokeWidth="1.5"
            />

            {/* Right face (Breadth / Width x Height) */}
            <Polygon
              points={`${frontBottom.x},${frontBottom.y} ${sideRightBottom.x},${sideRightBottom.y} ${sideRightTop.x},${sideRightTop.y} ${frontTop.x},${frontTop.y}`}
              fill="url(#rightFaceGrad)"
              stroke="#6B5C45"
              strokeWidth="1.5"
            />

            {/* Top face (Length x Breadth) */}
            <Polygon
              points={`${frontTop.x},${frontTop.y} ${sideRightTop.x},${sideRightTop.y} ${backTop.x},${backTop.y} ${frontLeftTop.x},${frontLeftTop.y}`}
              fill="url(#topFaceGrad)"
              stroke="#6B5C45"
              strokeWidth="1.5"
            />

            {/* Packaging Tape on Top Face */}
            <Polygon
              points={`
                ${(frontTop.x + frontLeftTop.x) / 2},${(frontTop.y + frontLeftTop.y) / 2}
                ${(frontTop.x + frontLeftTop.x) / 2 + 10},${(frontTop.y + frontLeftTop.y) / 2 + 4}
                ${(backTop.x + sideRightTop.x) / 2 + 10},${(backTop.y + sideRightTop.y) / 2 + 4}
                ${(backTop.x + sideRightTop.x) / 2},${(backTop.y + sideRightTop.y) / 2}
              `}
              fill="#D49A3D"
              opacity="0.85"
            />

            {/* Packaging Tape down the Left Face */}
            <Polygon
              points={`
                ${(frontTop.x + frontLeftTop.x) / 2},${(frontTop.y + frontLeftTop.y) / 2}
                ${(frontTop.x + frontLeftTop.x) / 2 + 10},${(frontTop.y + frontLeftTop.y) / 2 + 4}
                ${(frontBottom.x + frontLeftBottom.x) / 2 + 10},${(frontBottom.y + frontLeftBottom.y) / 2 + 4}
                ${(frontBottom.x + frontLeftBottom.x) / 2},${(frontBottom.y + frontLeftBottom.y) / 2}
              `}
              fill="#D49A3D"
              opacity="0.85"
            />

            {/* Logistics barcode sticker representation on front face */}
            <Rect
              x={(frontBottom.x + frontLeftBottom.x) / 2 - 20}
              y={(frontTop.y + frontBottom.y) / 2 - 14}
              width="24"
              height="15"
              fill="#FFFFFF"
              opacity="0.85"
              stroke="#888"
              strokeWidth="0.5"
            />
            {/* Miniature barcode stripes */}
            <Line
              x1={(frontBottom.x + frontLeftBottom.x) / 2 - 17}
              y1={(frontTop.y + frontBottom.y) / 2 - 10}
              x2={(frontBottom.x + frontLeftBottom.x) / 2 - 17}
              y2={(frontTop.y + frontBottom.y) / 2 - 2}
              stroke="#111"
              strokeWidth="1.5"
            />
            <Line
              x1={(frontBottom.x + frontLeftBottom.x) / 2 - 13}
              y1={(frontTop.y + frontBottom.y) / 2 - 10}
              x2={(frontBottom.x + frontLeftBottom.x) / 2 - 13}
              y2={(frontTop.y + frontBottom.y) / 2 - 2}
              stroke="#111"
              strokeWidth="2"
            />
            <Line
              x1={(frontBottom.x + frontLeftBottom.x) / 2 - 9}
              y1={(frontTop.y + frontBottom.y) / 2 - 10}
              x2={(frontBottom.x + frontLeftBottom.x) / 2 - 9}
              y2={(frontTop.y + frontBottom.y) / 2 - 2}
              stroke="#111"
              strokeWidth="1"
            />
            <Line
              x1={(frontBottom.x + frontLeftBottom.x) / 2 - 5}
              y1={(frontTop.y + frontBottom.y) / 2 - 10}
              x2={(frontBottom.x + frontLeftBottom.x) / 2 - 5}
              y2={(frontTop.y + frontBottom.y) / 2 - 2}
              stroke="#111"
              strokeWidth="1.5"
            />

            {/* DIMENSION LINES & LABELS */}

            {/* 1. Length (L) Dimension Line - along front left */}
            <G>
              <Line
                x1={frontLeftBottom.x - 10}
                y1={frontLeftBottom.y + 12}
                x2={frontBottom.x - 10}
                y2={frontBottom.y + 12}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* End caps */}
              <Line
                x1={frontLeftBottom.x - 14}
                y1={frontLeftBottom.y + 8}
                x2={frontLeftBottom.x - 6}
                y2={frontLeftBottom.y + 16}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              <Line
                x1={frontBottom.x - 14}
                y1={frontBottom.y + 8}
                x2={frontBottom.x - 6}
                y2={frontBottom.y + 16}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* Pill badge for Length */}
              <Rect
                x={(frontLeftBottom.x + frontBottom.x) / 2 - 38}
                y={(frontLeftBottom.y + frontBottom.y) / 2 + 16}
                width="76"
                height="20"
                rx="10"
                fill="#14181F"
              />
              <SvgText
                x={(frontLeftBottom.x + frontBottom.x) / 2}
                y={(frontLeftBottom.y + frontBottom.y) / 2 + 30}
                fill="#FFBE1A"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {`L: ${formatDim(l)}`}
              </SvgText>
            </G>

            {/* 2. Breadth / Width (W) Dimension Line - along right bottom */}
            <G>
              <Line
                x1={frontBottom.x + 10}
                y1={frontBottom.y + 12}
                x2={sideRightBottom.x + 10}
                y2={sideRightBottom.y + 12}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* End caps */}
              <Line
                x1={frontBottom.x + 6}
                y1={frontBottom.y + 16}
                x2={frontBottom.x + 14}
                y2={frontBottom.y + 8}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              <Line
                x1={sideRightBottom.x + 6}
                y1={sideRightBottom.y + 16}
                x2={sideRightBottom.x + 14}
                y2={sideRightBottom.y + 8}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* Pill badge for Width */}
              <Rect
                x={(frontBottom.x + sideRightBottom.x) / 2 - 5}
                y={(frontBottom.y + sideRightBottom.y) / 2 + 16}
                width="76"
                height="20"
                rx="10"
                fill="#14181F"
              />
              <SvgText
                x={(frontBottom.x + sideRightBottom.x) / 2 + 33}
                y={(frontBottom.y + sideRightBottom.y) / 2 + 30}
                fill="#FFBE1A"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {`W: ${formatDim(b)}`}
              </SvgText>
            </G>

            {/* 3. Height (H) Dimension Line - along front corner */}
            <G>
              <Line
                x1={frontBottom.x + 18}
                y1={frontBottom.y}
                x2={frontTop.x + 18}
                y2={frontTop.y}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* End caps */}
              <Line
                x1={frontBottom.x + 12}
                y1={frontBottom.y}
                x2={frontBottom.x + 24}
                y2={frontBottom.y}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              <Line
                x1={frontTop.x + 12}
                y1={frontTop.y}
                x2={frontTop.x + 24}
                y2={frontTop.y}
                stroke="#1E232A"
                strokeWidth="1.5"
              />
              {/* Pill badge for Height */}
              <Rect
                x={frontTop.x + 24}
                y={(frontTop.y + frontBottom.y) / 2 - 10}
                width="72"
                height="20"
                rx="10"
                fill="#14181F"
              />
              <SvgText
                x={frontTop.x + 60}
                y={(frontTop.y + frontBottom.y) / 2 + 4}
                fill="#FFBE1A"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {`H: ${formatDim(h)}`}
              </SvgText>
            </G>
          </Svg>
        </View>
      ) : (
        /* Orthogonal Projections View: Front, Side, Top 2D views */
        <View style={styles.orthoGrid}>
          <View style={styles.orthoCard}>
            <Text style={styles.orthoTitle}>Front Face (L × H)</Text>
            <View style={[styles.orthoBox, { aspectRatio: Math.max(0.4, Math.min(2.5, l / h)) }]}>
              <Text style={styles.orthoBoxText}>{`${formatDim(l)} × ${formatDim(h)}`}</Text>
            </View>
            <Text style={styles.orthoSub}>Length × Height</Text>
          </View>

          <View style={styles.orthoCard}>
            <Text style={styles.orthoTitle}>Side Face (W × H)</Text>
            <View style={[styles.orthoBox, { aspectRatio: Math.max(0.4, Math.min(2.5, b / h)) }]}>
              <Text style={styles.orthoBoxText}>{`${formatDim(b)} × ${formatDim(h)}`}</Text>
            </View>
            <Text style={styles.orthoSub}>Breadth × Height</Text>
          </View>

          <View style={styles.orthoCard}>
            <Text style={styles.orthoTitle}>Top Face (L × W)</Text>
            <View style={[styles.orthoBox, { aspectRatio: Math.max(0.4, Math.min(2.5, l / b)) }]}>
              <Text style={styles.orthoBoxText}>{`${formatDim(l)} × ${formatDim(b)}`}</Text>
            </View>
            <Text style={styles.orthoSub}>Length × Breadth</Text>
          </View>
        </View>
      )}

      {/* Volume & Details Footer Bar */}
      <View style={styles.footerRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Volume</Text>
          <Text style={styles.metricValue}>
            {Math.round(l * b * h).toLocaleString()} <Text style={styles.metricUnit}>cm³</Text>
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Volumetric Weight (IATA)</Text>
          <Text style={styles.metricValue}>
            {((l * b * h) / 5000).toFixed(2)} <Text style={styles.metricUnit}>kg</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  techTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  ratioText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.charcoal,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  orthoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 8,
  },
  orthoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    padding: 8,
  },
  orthoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  orthoBox: {
    width: '80%',
    maxHeight: 75,
    minHeight: 45,
    backgroundColor: '#DECAAB',
    borderWidth: 1.5,
    borderColor: '#78664B',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  orthoBoxText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.charcoal,
    textAlign: 'center',
  },
  orthoSub: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
});

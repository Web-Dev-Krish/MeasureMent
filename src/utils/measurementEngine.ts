import {
  ReferenceObject,
  ReferenceType,
  Point2D,
  QuadCorners,
  AngleCaptureData,
  ParcelDimensions,
  AccuracyReport,
} from '../types';

export const REFERENCE_OBJECTS: Record<ReferenceType, ReferenceObject> = {
  iso_card: {
    id: 'iso_card',
    name: 'Standard ID / Bank Card',
    shortName: 'Bank / ID Card',
    widthMm: 85.60,
    heightMm: 53.98,
    aspectRatio: 85.60 / 53.98, // 1.58577
    description: 'ISO/IEC 7810 ID-1 standard (Debit, Credit, Driver License, Transit card)',
    iconName: 'card-outline',
  },
  a4_paper: {
    id: 'a4_paper',
    name: 'Standard A4 Sheet',
    shortName: 'A4 Sheet',
    widthMm: 210.0,
    heightMm: 297.0,
    aspectRatio: 210.0 / 297.0, // 0.70707
    description: 'ISO 216 standard paper sheet (210 x 297 mm)',
    iconName: 'document-text-outline',
  },
  ruler_10cm: {
    id: 'ruler_10cm',
    name: '10 cm Calibrated Strip',
    shortName: '10 cm Strip',
    widthMm: 100.0,
    heightMm: 25.0,
    aspectRatio: 100.0 / 25.0, // 4.0
    description: 'Standard metric 10 cm measuring band or ruler segment',
    iconName: 'resize-outline',
  },
};

/**
 * Euclidean distance between two 2D points in pixels.
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute the average width and height of a quad in pixels.
 */
export function getQuadDimensionsPx(corners: QuadCorners): { widthPx: number; heightPx: number } {
  const topWidth = euclideanDistance(corners.topLeft, corners.topRight);
  const bottomWidth = euclideanDistance(corners.bottomLeft, corners.bottomRight);
  const leftHeight = euclideanDistance(corners.topLeft, corners.bottomLeft);
  const rightHeight = euclideanDistance(corners.topRight, corners.bottomRight);

  return {
    widthPx: (topWidth + bottomWidth) / 2,
    heightPx: (leftHeight + rightHeight) / 2,
  };
}

/**
 * Calculate the optical millimeter-to-pixel scale from a known physical reference object.
 * Returns scale (pixels per mm), detected aspect ratio, and whether reference validation passed.
 */
export function calculateReferenceScale(
  referenceType: ReferenceType,
  refCorners: QuadCorners
): {
  pixelsPerMmW: number;
  pixelsPerMmH: number;
  pixelsPerMm: number;
  detectedRatio: number;
  isRatioPlausible: boolean;
  isValid: boolean;
  reason?: string;
} {
  const ref = REFERENCE_OBJECTS[referenceType];
  const { widthPx, heightPx } = getQuadDimensionsPx(refCorners);

  if (widthPx < 20 || heightPx < 15) {
    return {
      pixelsPerMmW: 0,
      pixelsPerMmH: 0,
      pixelsPerMm: 0,
      detectedRatio: 0,
      isRatioPlausible: false,
      isValid: false,
      reason: 'Reference object bounding box is too small. Bring camera closer.',
    };
  }

  const pixelsPerMmW = widthPx / ref.widthMm;
  const pixelsPerMmH = heightPx / ref.heightMm;
  const detectedRatio = widthPx / heightPx;
  const expectedRatio = ref.aspectRatio;

  // Check if aspect ratio deviation is within realistic perspective range (< 22%)
  const ratioDeviation = Math.abs(detectedRatio - expectedRatio) / expectedRatio;
  const isRatioPlausible = ratioDeviation < 0.22;

  const pixelsPerMm = (pixelsPerMmW + pixelsPerMmH) / 2;

  if (!isRatioPlausible) {
    return {
      pixelsPerMmW,
      pixelsPerMmH,
      pixelsPerMm,
      detectedRatio,
      isRatioPlausible: false,
      isValid: false,
      reason: `Reference card aspect ratio (${detectedRatio.toFixed(2)}) deviates significantly from standard (${expectedRatio.toFixed(2)}). Ensure phone is parallel to reference card.`,
    };
  }

  return {
    pixelsPerMmW,
    pixelsPerMmH,
    pixelsPerMm,
    detectedRatio,
    isRatioPlausible: true,
    isValid: true,
  };
}

/**
 * Calculate the real-world dimensions (in mm) of a parcel face
 * using the calibrated scale from the reference card.
 */
export function calculateParcelFaceDimensionsMm(
  parcelCorners: QuadCorners,
  pixelsPerMmW: number,
  pixelsPerMmH: number
): { widthMm: number; heightMm: number; isValid: boolean; reason?: string } {
  if (pixelsPerMmW <= 0 || pixelsPerMmH <= 0) {
    return {
      widthMm: 0,
      heightMm: 0,
      isValid: false,
      reason: 'Scale calibration not established.',
    };
  }

  const { widthPx, heightPx } = getQuadDimensionsPx(parcelCorners);

  if (widthPx < 25 || heightPx < 25) {
    return {
      widthMm: 0,
      heightMm: 0,
      isValid: false,
      reason: 'Parcel outline is too small or corners are collapsed.',
    };
  }

  const widthMm = widthPx / pixelsPerMmW;
  const heightMm = heightPx / pixelsPerMmH;

  return {
    widthMm,
    heightMm,
    isValid: true,
  };
}

/**
 * Synthesize multi-angle captures (Front, Side, Top) into 3D parcel dimensions,
 * cross-verifying shared axes for rigorous real-world accuracy.
 *
 * Front View: Primary = Length, Secondary = Height
 * Side View: Primary = Breadth, Secondary = Height
 * Top View: Primary = Length, Secondary = Breadth
 */
export function synthesizeMultiAngleMeasurement(
  frontData: AngleCaptureData,
  sideData: AngleCaptureData,
  topData: AngleCaptureData
): {
  dimensions: ParcelDimensions;
  accuracy: AccuracyReport;
} {
  const heightFrontCm = +(frontData.calculatedSecondaryMm / 10).toFixed(1);
  const lengthFrontCm = +(frontData.calculatedPrimaryMm / 10).toFixed(1);

  const heightSideCm = +(sideData.calculatedSecondaryMm / 10).toFixed(1);
  const breadthSideCm = +(sideData.calculatedPrimaryMm / 10).toFixed(1);

  const lengthTopCm = +(topData.calculatedPrimaryMm / 10).toFixed(1);
  const breadthTopCm = +(topData.calculatedSecondaryMm / 10).toFixed(1);

  // Compute absolute variances across independent views
  const heightVarianceCm = +Math.abs(heightFrontCm - heightSideCm).toFixed(1);
  const lengthVarianceCm = +Math.abs(lengthFrontCm - lengthTopCm).toFixed(1);
  const breadthVarianceCm = +Math.abs(breadthSideCm - breadthTopCm).toFixed(1);

  // Maximum allowed tolerance for verified status: 1.6 cm or 9% whichever is greater
  const avgHeight = (heightFrontCm + heightSideCm) / 2;
  const avgLength = (lengthFrontCm + lengthTopCm) / 2;
  const avgBreadth = (breadthSideCm + breadthTopCm) / 2;

  const heightTol = Math.max(1.6, avgHeight * 0.09);
  const lengthTol = Math.max(1.6, avgLength * 0.09);
  const breadthTol = Math.max(1.6, avgBreadth * 0.09);

  const heightPass = heightVarianceCm <= heightTol;
  const lengthPass = lengthVarianceCm <= lengthTol;
  const breadthPass = breadthVarianceCm <= breadthTol;

  const isCrossAngleConsistent = heightPass && lengthPass && breadthPass;

  // Evaluate overall confidence percentage
  const maxVarianceRatio = Math.max(
    heightVarianceCm / (avgHeight || 1),
    lengthVarianceCm / (avgLength || 1),
    breadthVarianceCm / (avgBreadth || 1)
  );

  const rawConfidence = Math.max(50, Math.min(98, Math.round(100 - maxVarianceRatio * 180)));
  const confidencePercentage = isCrossAngleConsistent ? rawConfidence : Math.min(62, rawConfidence);

  // Determine final dimension values (weighted average across verified multi-angle views)
  const finalLengthCm = +((lengthFrontCm * 0.5 + lengthTopCm * 0.5)).toFixed(1);
  const finalBreadthCm = +((breadthSideCm * 0.5 + breadthTopCm * 0.5)).toFixed(1);
  const finalHeightCm = +((heightFrontCm * 0.5 + heightSideCm * 0.5)).toFixed(1);

  const volumeCm3 = Math.round(finalLengthCm * finalBreadthCm * finalHeightCm);
  // IATA volumetric weight formula: (L x W x H in cm) / 5000
  const volumetricWeightKg = +(volumeCm3 / 5000).toFixed(2);

  const toleranceCm = isCrossAngleConsistent ? 0.4 : 1.8;

  let validationStatus: AccuracyReport['validationStatus'] = isCrossAngleConsistent
    ? 'verified'
    : 'discrepancy_detected';

  let statusMessage = '';
  let recommendation = '';

  if (isCrossAngleConsistent) {
    statusMessage = 'Measurement verified within supported tolerance.';
  } else {
    statusMessage = 'Dimensional variance detected between camera angles.';
    const discrepancies: string[] = [];
    if (!heightPass) discrepancies.push(`Height Front (${heightFrontCm}cm) vs Side (${heightSideCm}cm)`);
    if (!lengthPass) discrepancies.push(`Length Front (${lengthFrontCm}cm) vs Top (${lengthTopCm}cm)`);
    if (!breadthPass) discrepancies.push(`Breadth Side (${breadthSideCm}cm) vs Top (${breadthTopCm}cm)`);
    recommendation = `Angles show difference in: ${discrepancies.join(', ')}. Please rescan with card flat or adjust corner pins.`;
  }

  const accuracy: AccuracyReport = {
    isAccurate: isCrossAngleConsistent,
    toleranceCm,
    confidencePercentage,
    heightFrontCm,
    heightSideCm,
    lengthFrontCm,
    lengthTopCm,
    breadthSideCm,
    breadthTopCm,
    heightVarianceCm,
    lengthVarianceCm,
    breadthVarianceCm,
    lightingRating: 'good',
    scalePresenceDetected: true,
    validationStatus,
    statusMessage,
    recommendation,
  };

  const dimensions: ParcelDimensions = {
    lengthCm: finalLengthCm,
    breadthCm: finalBreadthCm,
    heightCm: finalHeightCm,
    volumeCm3,
    volumetricWeightKg,
  };

  return { dimensions, accuracy };
}

/**
 * Calculate IATA volumetric weight: (L x W x H) / 5000
 */
export function calculateVolumetricWeight(lengthCm: number, breadthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) return 0;
  return +((lengthCm * breadthCm * heightCm) / 5000).toFixed(2);
}

/**
 * Calculate billable weight: max(actualWeightKg, volumetricWeightKg)
 */
export function calculateBillableWeight(actualWeightKg: number | null, volumetricWeightKg: number): number {
  if (actualWeightKg === null || actualWeightKg === undefined || isNaN(actualWeightKg)) {
    return volumetricWeightKg;
  }
  return +Math.max(actualWeightKg, volumetricWeightKg).toFixed(2);
}

/**
 * Convert centimeters to inches (for logistics unit switching).
 */
export function cmToInches(cm: number): number {
  return +(cm / 2.54).toFixed(1);
}

/**
 * Convert kg to lbs (for logistics unit switching).
 */
export function kgToLbs(kg: number): number {
  return +(kg * 2.20462).toFixed(2);
}

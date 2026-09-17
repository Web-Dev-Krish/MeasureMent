export type ReferenceType = 'iso_card' | 'a4_paper' | 'ruler_10cm';

export interface ReferenceObject {
  id: ReferenceType;
  name: string;
  shortName: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  description: string;
  iconName: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

export type CaptureAngle = 'front' | 'side' | 'top';

export interface AngleCaptureData {
  angle: CaptureAngle;
  title: string;
  subtitle: string;
  imageUri: string | null;
  parcelCorners: QuadCorners;
  referenceCorners: QuadCorners;
  pixelsPerMm: number;
  calculatedPrimaryMm: number; // For front: Length; for side: Breadth; for top: Length
  calculatedSecondaryMm: number; // For front: Height; for side: Height; for top: Breadth
  isCalibrated: boolean;
  lightingQuality: 'good' | 'adequate' | 'poor';
  timestamp: number;
}

export interface ParcelDimensions {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  volumeCm3: number;
  volumetricWeightKg: number; // (L * B * H) / 5000
}

export interface AccuracyReport {
  isAccurate: boolean;
  toleranceCm: number; // e.g. 0.4
  confidencePercentage: number; // e.g. 94%
  heightFrontCm: number;
  heightSideCm: number;
  lengthFrontCm: number;
  lengthTopCm: number;
  breadthSideCm: number;
  breadthTopCm: number;
  heightVarianceCm: number;
  lengthVarianceCm: number;
  breadthVarianceCm: number;
  lightingRating: 'good' | 'adequate' | 'poor';
  scalePresenceDetected: boolean;
  validationStatus: 'verified' | 'discrepancy_detected' | 'uncalibrated' | 'manual_verified';
  statusMessage: string;
  recommendation?: string;
}

export interface ParcelRecord {
  id: string;
  title: string;
  createdAt: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number | null; // Entered from weighing scale
  volumetricWeightKg: number;
  billableWeightKg: number;
  verificationType: 'calibrated_camera' | 'manually_verified' | 'manual_entry';
  referenceTypeUsed?: ReferenceType;
  confidenceScore?: number;
  toleranceCm?: number;
  frontImageUri?: string | null;
  sideImageUri?: string | null;
  topImageUri?: string | null;
  notes?: string;
}

export type RootStackParamList = {
  Home: undefined;
  CameraPermission: undefined;
  CalibrationSetup: undefined;
  MultiAngleCapture: { referenceType: ReferenceType; startingAngle?: CaptureAngle };
  AccuracyValidation: {
    referenceType: ReferenceType;
    frontData: AngleCaptureData;
    sideData: AngleCaptureData;
    topData: AngleCaptureData;
  };
  Result: {
    recordId?: string;
    dimensions: ParcelDimensions;
    accuracy: AccuracyReport;
    referenceType?: ReferenceType;
    frontImageUri?: string | null;
    sideImageUri?: string | null;
    topImageUri?: string | null;
    isManual?: boolean;
  };
  ManualMeasure: {
    initialDimensions?: { lengthCm?: number; breadthCm?: number; heightCm?: number; weightKg?: number };
  };
  History: undefined;
  HowItWorks: undefined;
};

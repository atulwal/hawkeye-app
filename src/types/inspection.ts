export type Status = 'PASS' | 'REWORK' | 'FAIL';

export type Measurement = {
  value: number;       // mm
  nominal: number;     // mm
  tolerance: number;   // mm (± tolerance)
};

export type BilletCorrection = {
  newId: string;
  by: string;
  at: string;          // ISO Date
  reason?: string;
};

export type Billet = {
  id: string;
  ocrId: string;              // raw OCR text, never overwritten
  ocrConfidence: number;      // 0.0 - 1.0
  timestamp: string;          // ISO Date string
  status: Status;
  length: Measurement;
  width: Measurement;
  height: Measurement;
  defects: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  corrections: BilletCorrection[];
  snapshotUri?: string;
  processingTimeMs?: number;
};

export type ToleranceConfig = {
  length: { nominal: number; tolerance: number };  // 1000 ± 5 mm
  width:  { nominal: number; tolerance: number };  // 120 ± 1 mm
  height: { nominal: number; tolerance: number };  // 120 ± 1 mm
  ocrThreshold: number;                            // 0.90
  pixelsPerMm: number;                             // calibration ratio, e.g. 2.45
};

export type HistoryFilterType = 'ALL' | 'PASS' | 'REWORK' | 'FAIL' | 'UNACKNOWLEDGED';

export type HistoryFilters = {
  status?: HistoryFilterType;
  defect?: string;
  searchQuery?: string;
};

export interface InspectionDataSource {
  subscribeToLiveFeed(cb: (b: Billet) => void): () => void;
  getHistory(filters?: HistoryFilters): Promise<Billet[]>;
  acknowledgeAlert(id: string, operator: string): Promise<Billet>;
  correctBilletId(id: string, newId: string, admin: string, reason?: string): Promise<Billet>;
  getTolerances(): Promise<ToleranceConfig>;
  updateTolerances(c: ToleranceConfig, admin: string): Promise<void>;
  triggerDemoBillet(forcedStatus: Status): Billet;
}

// Helpers for derived state
export function getDisplayedId(billet: Billet): string {
  if (billet.corrections && billet.corrections.length > 0) {
    return billet.corrections[billet.corrections.length - 1].newId;
  }
  return billet.ocrId;
}

export function isAcknowledged(billet: Billet): boolean {
  return Boolean(billet.acknowledgedBy && billet.acknowledgedAt);
}

export function getDelta(measurement: Measurement): number {
  return Number((measurement.value - measurement.nominal).toFixed(2));
}

export function isMeasurementInTolerance(measurement: Measurement): boolean {
  const delta = Math.abs(measurement.value - measurement.nominal);
  return delta <= measurement.tolerance;
}

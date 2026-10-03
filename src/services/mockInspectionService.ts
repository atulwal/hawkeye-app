import {
  Billet,
  HistoryFilters,
  InspectionDataSource,
  Status,
  ToleranceConfig,
  getDisplayedId,
  isAcknowledged,
  isMeasurementInTolerance,
} from '../types/inspection';
import { settingsService } from './settingsService';

let currentToleranceConfig: ToleranceConfig = {
  length: { nominal: 1000, tolerance: 5 },
  width: { nominal: 120, tolerance: 1 },
  height: { nominal: 120, tolerance: 1 },
  ocrThreshold: 0.90,
  pixelsPerMm: 2.45,
};

// Initialize tolerance config from settingsService
settingsService.getTolerances().then((cfg) => {
  currentToleranceConfig = cfg;
});

// Seed data generator helper
function generateSeededInspections(count: number = 40): Billet[] {
  const list: Billet[] = [];
  const now = Date.now();

  for (let i = count; i >= 1; i--) {
    const seq = 1000 + i;
    const timeOffsetMs = (count - i) * 35000 + Math.floor(Math.random() * 8000); // 35s apart
    const timestamp = new Date(now - timeOffsetMs).toISOString();
    const id = `blt-uuid-${seq}`;
    const ocrId = `BLT-2026-${seq}`;

    // Status distribution: ~85% PASS, 10% REWORK, 5% FAIL
    const rand = Math.random();
    let status: Status = 'PASS';
    let lengthVal = 1000 + (Math.random() * 4 - 2); // 998 - 1002
    let widthVal = 120 + (Math.random() * 0.8 - 0.4); // 119.6 - 120.4
    let heightVal = 120 + (Math.random() * 0.8 - 0.4);
    let defects: string[] = [];
    let ocrConfidence = Number((0.92 + Math.random() * 0.07).toFixed(2)); // 0.92 - 0.99
    let ackBy: string | undefined = undefined;
    let ackAt: string | undefined = undefined;

    if (rand < 0.08 || i === 38 || i === 12) {
      // FAIL case
      status = 'FAIL';
      const failDim = Math.random();
      if (failDim < 0.6) {
        lengthVal = 1000 + (Math.random() > 0.5 ? 8.4 : -7.8); // out of ±5
      } else if (failDim < 0.8) {
        widthVal = 120 + 2.3; // out of ±1
      } else {
        heightVal = 120 - 2.1;
      }
      // older fail records may be acknowledged
      if (i < count - 2) {
        ackBy = 'Atulya';
        ackAt = new Date(now - timeOffsetMs + 12000).toISOString();
      }
    } else if (rand < 0.20 || i === 35 || i === 20) {
      // REWORK case (within dimensional limits but defect or low OCR)
      status = 'REWORK';
      if (Math.random() > 0.5) {
        defects = ['Surface Scale Mark'];
      } else {
        ocrConfidence = Number((0.82 + Math.random() * 0.06).toFixed(2)); // low confidence < 0.90
      }
    }

    list.push({
      id,
      ocrId,
      ocrConfidence,
      timestamp,
      status,
      length: {
        value: Number(lengthVal.toFixed(1)),
        nominal: currentToleranceConfig.length.nominal,
        tolerance: currentToleranceConfig.length.tolerance,
      },
      width: {
        value: Number(widthVal.toFixed(1)),
        nominal: currentToleranceConfig.width.nominal,
        tolerance: currentToleranceConfig.width.tolerance,
      },
      height: {
        value: Number(heightVal.toFixed(1)),
        nominal: currentToleranceConfig.height.nominal,
        tolerance: currentToleranceConfig.height.tolerance,
      },
      defects,
      acknowledgedBy: ackBy,
      acknowledgedAt: ackAt,
      corrections: i === 25 ? [
        {
          newId: 'BLT-2026-1025',
          by: 'Admin',
          at: new Date(now - timeOffsetMs + 45000).toISOString(),
          reason: 'Corrected 8 to 5 from visual stamp',
        }
      ] : [],
      processingTimeMs: Math.floor(110 + Math.random() * 80),
    });
  }

  return list;
}

class MockInspectionService implements InspectionDataSource {
  private history: Billet[] = [];
  private sequenceNumber: number = 1041;
  private subscribers: Set<(b: Billet) => void> = new Set();
  private timer: any = null;

  constructor() {
    this.history = generateSeededInspections(40);
    this.startConveyorTicker();
  }

  private evaluateStatus(
    length: { value: number; nominal: number; tolerance: number },
    width: { value: number; nominal: number; tolerance: number },
    height: { value: number; nominal: number; tolerance: number },
    defects: string[],
    ocrConfidence: number
  ): Status {
    const isLenOk = isMeasurementInTolerance(length);
    const isWidOk = isMeasurementInTolerance(width);
    const isHgtOk = isMeasurementInTolerance(height);

    if (!isLenOk || !isWidOk || !isHgtOk) {
      return 'FAIL';
    }
    if (defects.length > 0 || ocrConfidence < currentToleranceConfig.ocrThreshold) {
      return 'REWORK';
    }
    return 'PASS';
  }

  private createBillet(forcedStatus?: Status): Billet {
    const seq = this.sequenceNumber++;
    const ocrId = `BLT-2026-${seq}`;
    const id = `blt-uuid-${seq}`;
    const now = new Date().toISOString();

    let lengthVal = currentToleranceConfig.length.nominal + (Math.random() * 3 - 1.5);
    let widthVal = currentToleranceConfig.width.nominal + (Math.random() * 0.6 - 0.3);
    let heightVal = currentToleranceConfig.height.nominal + (Math.random() * 0.6 - 0.3);
    let defects: string[] = [];
    let ocrConfidence = Number((0.93 + Math.random() * 0.06).toFixed(2));

    if (forcedStatus === 'FAIL') {
      lengthVal = currentToleranceConfig.length.nominal + 8.2; // Exceeds tolerance
    } else if (forcedStatus === 'REWORK') {
      defects = ['Minor Edge Burr'];
    } else if (forcedStatus === 'PASS') {
      lengthVal = currentToleranceConfig.length.nominal + 0.8;
      widthVal = currentToleranceConfig.width.nominal + 0.2;
      heightVal = currentToleranceConfig.height.nominal - 0.1;
      ocrConfidence = 0.98;
    } else {
      // Natural distribution
      const rand = Math.random();
      if (rand < 0.07) {
        lengthVal = currentToleranceConfig.length.nominal + (Math.random() > 0.5 ? 7.6 : -8.1);
      } else if (rand < 0.18) {
        if (Math.random() > 0.5) {
          defects = ['Surface Seam Defect'];
        } else {
          ocrConfidence = 0.85; // Low confidence
        }
      }
    }

    const length = {
      value: Number(lengthVal.toFixed(1)),
      nominal: currentToleranceConfig.length.nominal,
      tolerance: currentToleranceConfig.length.tolerance,
    };
    const width = {
      value: Number(widthVal.toFixed(1)),
      nominal: currentToleranceConfig.width.nominal,
      tolerance: currentToleranceConfig.width.tolerance,
    };
    const height = {
      value: Number(heightVal.toFixed(1)),
      nominal: currentToleranceConfig.height.nominal,
      tolerance: currentToleranceConfig.height.tolerance,
    };

    const status = this.evaluateStatus(length, width, height, defects, ocrConfidence);

    const billet: Billet = {
      id,
      ocrId,
      ocrConfidence,
      timestamp: now,
      status,
      length,
      width,
      height,
      defects,
      corrections: [],
      processingTimeMs: Math.floor(120 + Math.random() * 70),
    };

    // Prepend to history (newest first)
    this.history = [billet, ...this.history];
    return billet;
  }

  private startConveyorTicker() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const billet = this.createBillet();
      this.subscribers.forEach((cb) => {
        try {
          cb(billet);
        } catch (e) {
          console.error('Error notifying subscriber:', e);
        }
      });
    }, 4000); // 4-second cadence
  }

  public subscribeToLiveFeed(cb: (b: Billet) => void): () => void {
    this.subscribers.add(cb);
    // Immediately emit latest record if available
    if (this.history.length > 0) {
      cb(this.history[0]);
    }
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public async getHistory(filters?: HistoryFilters): Promise<Billet[]> {
    let result = [...this.history];

    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status === 'UNACKNOWLEDGED') {
        result = result.filter((b) => b.status === 'FAIL' && !isAcknowledged(b));
      } else {
        result = result.filter((b) => b.status === filters.status);
      }
    }

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim().toLowerCase();
      result = result.filter((b) => {
        const displayed = getDisplayedId(b).toLowerCase();
        const ocr = b.ocrId.toLowerCase();
        const hasDefect = b.defects.some((d) => d.toLowerCase().includes(q));
        const statusMatch = b.status.toLowerCase().includes(q);
        return displayed.includes(q) || ocr.includes(q) || hasDefect || statusMatch;
      });
    }

    return result;
  }

  public async acknowledgeAlert(id: string, operator: string): Promise<Billet> {
    const item = this.history.find((b) => b.id === id);
    if (!item) {
      throw new Error(`Billet with ID ${id} not found.`);
    }

    item.acknowledgedBy = operator || 'Atulya';
    item.acknowledgedAt = new Date().toISOString();
    // CRITICAL: status remains FAIL
    return { ...item };
  }

  public async correctBilletId(
    id: string,
    newId: string,
    admin: string,
    reason?: string
  ): Promise<Billet> {
    const item = this.history.find((b) => b.id === id);
    if (!item) {
      throw new Error(`Billet with ID ${id} not found.`);
    }

    item.corrections.push({
      newId: newId.trim().toUpperCase(),
      by: admin || 'Admin',
      at: new Date().toISOString(),
      reason: reason?.trim() || 'Manual OCR correction',
    });

    return { ...item };
  }

  public async getTolerances(): Promise<ToleranceConfig> {
    return { ...currentToleranceConfig };
  }

  public async updateTolerances(c: ToleranceConfig, _admin: string): Promise<void> {
    currentToleranceConfig = { ...c };
    await settingsService.saveTolerances(c);
  }

  public triggerDemoBillet(forcedStatus: Status): Billet {
    const billet = this.createBillet(forcedStatus);
    this.subscribers.forEach((cb) => cb(billet));
    return billet;
  }
}

export const mockInspectionService = new MockInspectionService();

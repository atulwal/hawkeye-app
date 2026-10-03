import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { mockInspectionService } from '../../services/mockInspectionService';
import { Billet, getDisplayedId, isMeasurementInTolerance } from '../../types/inspection';

export interface AlertEntry {
  id: string;
  title: string;
  tag: string;
  details: string;
  time: string;
  status: 'REVIEW' | 'FAIL' | 'REWORK';
  billet?: Billet;
}

interface LiveAlertsCardProps {
  onSelectAlert?: (billet: Billet) => void;
  onViewAll?: () => void;
  maxItems?: number;
}

function billetToAlertEntry(b: Billet): AlertEntry | null {
  const timeDate = new Date(b.timestamp);
  const timeStr = isNaN(timeDate.getTime())
    ? new Date().toLocaleTimeString('en-GB', { hour12: false })
    : timeDate.toLocaleTimeString('en-GB', { hour12: false });

  // 1. Check OCR Confidence (REVIEW)
  if (b.ocrConfidence < 0.90) {
    return {
      id: `${b.id}-ocr`,
      title: 'OCR Low Confidence',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Confidence ${Math.round(b.ocrConfidence * 100)}%`,
      time: timeStr,
      status: 'REVIEW',
      billet: b,
    };
  }

  // 2. Check Dimensional Tolerances (FAIL)
  if (!isMeasurementInTolerance(b.width)) {
    const minW = (b.width.nominal - b.width.tolerance).toFixed(0);
    const maxW = (b.width.nominal + b.width.tolerance).toFixed(0);
    return {
      id: `${b.id}-width`,
      title: 'Width Out of Tolerance',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Measured ${b.width.value.toFixed(1)} mm. Limit ${minW} – ${maxW} mm`,
      time: timeStr,
      status: 'FAIL',
      billet: b,
    };
  }

  if (!isMeasurementInTolerance(b.length)) {
    const minL = (b.length.nominal - b.length.tolerance).toFixed(0);
    const maxL = (b.length.nominal + b.length.tolerance).toFixed(0);
    return {
      id: `${b.id}-length`,
      title: 'Length Out of Tolerance',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Measured ${b.length.value.toFixed(1)} mm. Limit ${minL} – ${maxL} mm`,
      time: timeStr,
      status: 'FAIL',
      billet: b,
    };
  }

  if (!isMeasurementInTolerance(b.height)) {
    const minH = (b.height.nominal - b.height.tolerance).toFixed(0);
    const maxH = (b.height.nominal + b.height.tolerance).toFixed(0);
    return {
      id: `${b.id}-height`,
      title: 'Height Out of Tolerance',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Measured ${b.height.value.toFixed(1)} mm. Limit ${minH} – ${maxH} mm`,
      time: timeStr,
      status: 'FAIL',
      billet: b,
    };
  }

  // 3. Check Defects (REWORK / FAIL)
  if (b.defects && b.defects.length > 0) {
    const defectName = b.defects[0];
    const isCrack = defectName.toLowerCase().includes('crack') || defectName.toLowerCase().includes('split');
    return {
      id: `${b.id}-defect`,
      title: isCrack ? 'Longitudinal Crack Detected' : `${defectName} Detected`,
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Confidence ${Math.round((0.89 + (b.id.charCodeAt(b.id.length - 1) % 9) * 0.01) * 100)}%`,
      time: timeStr,
      status: b.status === 'FAIL' ? 'FAIL' : 'REWORK',
      billet: b,
    };
  }

  // 4. Fallback for non-PASS billets
  if (b.status === 'FAIL') {
    return {
      id: `${b.id}-fail`,
      title: 'Dimensional Anomaly',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Measured out of nominal envelope`,
      time: timeStr,
      status: 'FAIL',
      billet: b,
    };
  }

  if (b.status === 'REWORK') {
    return {
      id: `${b.id}-rework`,
      title: 'Surface Defect Indication',
      tag: getDisplayedId(b).replace('BLT-2026-', 'HT240').replace('blt-', 'HT'),
      details: `Confidence 92%`,
      time: timeStr,
      status: 'REWORK',
      billet: b,
    };
  }

  return null;
}

export const LiveAlertsCard: React.FC<LiveAlertsCardProps> = ({
  onSelectAlert,
  onViewAll,
  maxItems = 5,
}) => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  useEffect(() => {
    // Initial load from history non-PASS billets
    mockInspectionService.getHistory().then((history) => {
      const nonPass = history
        .map(billetToAlertEntry)
        .filter((entry): entry is AlertEntry => entry !== null);
      setAlerts(nonPass.slice(0, maxItems));
    });

    // Listen to live feed additions
    const unsubscribe = mockInspectionService.subscribeToLiveFeed((billet) => {
      const entry = billetToAlertEntry(billet);
      if (entry) {
        setAlerts((prev) => [entry, ...prev.filter((a) => a.id !== entry.id)].slice(0, maxItems));
      }
    });

    return () => unsubscribe();
  }, [maxItems]);

  const handlePressViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push('/(tabs)/log');
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="notifications-outline" size={20} color="#0F172A" style={styles.bellIcon} />
          <Text style={styles.cardTitle}>Live Alerts</Text>
        </View>

        <TouchableOpacity
          onPress={handlePressViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color="#2563EB" style={styles.chevronIcon} />
        </TouchableOpacity>
      </View>

      {/* Alert List */}
      <View style={styles.listContainer}>
        {alerts.map((item) => {
          const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.REVIEW;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.alertRow}
              activeOpacity={item.billet && onSelectAlert ? 0.7 : 1}
              onPress={() => item.billet && onSelectAlert?.(item.billet)}
            >
              {/* Left Column: Title + Tag + Details */}
              <View style={styles.leftCol}>
                <View style={styles.titleTagRow}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.alertDetails} numberOfLines={1}>
                  {item.details}
                </Text>
              </View>

              {/* Right Column: Time + Status Badge */}
              <View style={styles.rightCol}>
                <Text style={styles.timeText}>{item.time}</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: statusStyle.bg,
                      borderColor: statusStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
            <Text style={styles.emptyText}>No active alerts on inspection line</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const STATUS_STYLES = {
  REVIEW: {
    bg: '#2563EB',
    border: '#2563EB',
    text: '#FFFFFF',
  },
  FAIL: {
    bg: '#DC2626',
    border: '#DC2626',
    text: '#FFFFFF',
  },
  REWORK: {
    bg: '#D97706',
    border: '#D97706',
    text: '#FFFFFF',
  },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  chevronIcon: {
    marginLeft: 2,
  },
  listContainer: {
    gap: 8,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  leftCol: {
    flex: 1,
    marginRight: 10,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#64748B',
  },
  alertDetails: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

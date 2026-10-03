import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId } from '../../types/inspection';

interface LiveTelemetryCardProps {
  billet: Billet;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({ billet }) => {
  const displayedId = getDisplayedId(billet);
  const ocrPct = Math.round(billet.ocrConfidence * 100);

  const lengthVal = `${billet.length.value.toFixed(0)} mm`;
  const widthVal = `${billet.width.value.toFixed(1)} mm`;
  const heightVal = `${billet.height.value.toFixed(1)} mm`;

  const defectLabel =
    billet.defects.length > 0
      ? billet.defects.join(', ')
      : billet.status === 'PASS'
      ? 'None (Nominal)'
      : billet.status === 'REWORK'
      ? 'Low Confidence / Surface Mark'
      : 'Out of Tolerance';

  const badgeBg = {
    PASS: COLORS.pass,
    REWORK: COLORS.rework,
    FAIL: COLORS.fail,
  }[billet.status];

  const hasCrack = billet.status !== 'PASS' || billet.defects.length > 0;

  return (
    <View style={styles.card}>
      {/* Top Header: Active Inspection Tag + Billet ID + Status Pill */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.activeInspectionTag}>
            <Ionicons name="scan-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.activeInspectionText}>ACTIVE INSPECTION</Text>
          </View>
          <Text style={styles.billetTitleId}>{displayedId}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={styles.statusBadgeText}>{billet.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Main Body: Left Billet Zoom / Defect Viewport + Right Specs Table */}
      <View style={styles.bodyGrid}>
        {/* Left Side: Billet Snapshot Viewport */}
        <View style={styles.snapshotContainer}>
          <Svg width="100%" height="100%" viewBox="0 0 160 210" preserveAspectRatio="xMidYMid meet">
            {/* Dark background */}
            <Rect x="0" y="0" width="160" height="210" fill="#0B0F17" rx="8" />

            {/* Steel Billet Body */}
            <Polygon points="0,45 160,25 160,195 0,205" fill="#1E293B" />
            <Polygon points="0,60 160,40 160,85 0,105" fill="#334155" opacity="0.6" />
            <Polygon points="0,110 160,90 160,190 0,200" fill="#243347" />

            {/* Subtle Guidelines */}
            <Line x1="0" y1="105" x2="160" y2="90" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
            
            {/* OCR Stenciled ID on the Steel Surface */}
            <SvgText
              x="12"
              y="155"
              fill="#FFFFFF"
              fontSize="20"
              fontWeight="900"
              fontFamily={TYPOGRAPHY.fontFamily.mono}
              letterSpacing="1"
            >
              {displayedId.length > 10 ? displayedId.slice(0, 10) : displayedId}
            </SvgText>

            {/* Crack / Defect Vector Highlight */}
            {hasCrack && (
              <>
                <Path
                  d="M 115 118 L 122 142 L 118 162 L 126 188"
                  stroke={billet.status === 'FAIL' ? '#EF4444' : '#F59E0B'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Defect glow */}
                <Path
                  d="M 115 118 L 122 142 L 118 162 L 126 188"
                  stroke={billet.status === 'FAIL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </>
            )}
          </Svg>
        </View>

        {/* Right Side: Measurements & Inspection Specs Table */}
        <View style={styles.tableContainer}>
          {/* Row 1: Billet ID */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Billet ID</Text>
            <Text style={[styles.tableVal, styles.tableValBold]}>{displayedId}</Text>
          </View>

          {/* Row 2: Length */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Length</Text>
            <Text style={styles.tableVal}>{lengthVal}</Text>
          </View>

          {/* Row 3: Width */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Width</Text>
            <Text style={styles.tableVal}>{widthVal}</Text>
          </View>

          {/* Row 4: Height */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Height</Text>
            <Text style={styles.tableVal}>{heightVal}</Text>
          </View>

          {/* Row 5: Defect */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Defect</Text>
            <Text
              style={[
                styles.tableVal,
                styles.defectVal,
                { color: billet.status === 'FAIL' ? COLORS.fail : billet.status === 'REWORK' ? COLORS.rework : COLORS.textPrimary },
              ]}
              numberOfLines={2}
            >
              {defectLabel}
            </Text>
          </View>

          {/* Row 6: Confidence */}
          <View style={[styles.tableRow, styles.tableRowLast]}>
            <Text style={styles.tableLabel}>Confidence</Text>
            <Text style={styles.tableVal}>{ocrPct}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  activeInspectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeInspectionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  billetTitleId: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  bodyGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'stretch',
  },
  snapshotContainer: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#0B0F17',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tableContainer: {
    flex: 1.4,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  tableVal: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    textAlign: 'right',
  },
  tableValBold: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  defectVal: {
    fontWeight: '700',
    maxWidth: '58%',
  },
});

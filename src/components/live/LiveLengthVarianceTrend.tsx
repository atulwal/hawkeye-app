import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { mockInspectionService } from '../../services/mockInspectionService';
import { Billet, ToleranceConfig } from '../../types/inspection';

interface LiveLengthVarianceTrendProps {
  maxDataPoints?: number;
}

export const LiveLengthVarianceTrend: React.FC<LiveLengthVarianceTrendProps> = ({
  maxDataPoints = 14,
}) => {
  const [billets, setBillets] = useState<Billet[]>([]);
  const [tolerances, setTolerances] = useState<ToleranceConfig>({
    length: { nominal: 1000, tolerance: 5 },
    width: { nominal: 120, tolerance: 1 },
    height: { nominal: 120, tolerance: 1 },
    ocrThreshold: 0.90,
    pixelsPerMm: 2.45,
  });

  useEffect(() => {
    mockInspectionService.getTolerances().then(setTolerances);

    // Initial load from history
    mockInspectionService.getHistory().then((history) => {
      setBillets(history.slice(0, maxDataPoints).reverse());
    });

    // Subscribe to real-time live feed
    const unsubscribe = mockInspectionService.subscribeToLiveFeed((newBillet) => {
      setBillets((prev) => [...prev.slice(-(maxDataPoints - 1)), newBillet]);
    });

    return () => unsubscribe();
  }, [maxDataPoints]);

  if (billets.length === 0) {
    return null;
  }

  const nominal = tolerances.length.nominal || 1000;
  const tol = tolerances.length.tolerance || 5;

  const chartHeight = 140;
  const chartWidth = 340;
  const paddingLeft = 36;
  const paddingRight = 14;
  const paddingTop = 18;
  const paddingBottom = 22;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Chart range: ±(tol + 3mm)
  const rangeMargin = 3.5;
  const minVal = nominal - tol - rangeMargin;
  const maxVal = nominal + tol + rangeMargin;
  const valRange = maxVal - minVal;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / valRange;
    return paddingTop + (innerHeight - ratio * innerHeight);
  };

  const getX = (index: number) => {
    if (billets.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (billets.length - 1)) * innerWidth;
  };

  const points = billets
    .map((b, i) => `${getX(i).toFixed(1)},${getY(b.length.value).toFixed(1)}`)
    .join(' ');

  const upperLimitY = getY(nominal + tol);
  const nominalY = getY(nominal);
  const lowerLimitY = getY(nominal - tol);

  // Calculate live stats
  const latestBillet = billets[billets.length - 1];
  const latestVal = latestBillet ? latestBillet.length.value : nominal;
  const latestDiff = latestVal - nominal;
  const latestDiffStr = (latestDiff >= 0 ? '+' : '') + latestDiff.toFixed(1);
  const isLatestInTol = Math.abs(latestDiff) <= tol;

  // Statistical Mean & Std Dev
  const meanVal = billets.reduce((acc, b) => acc + b.length.value, 0) / billets.length;
  const variance =
    billets.reduce((acc, b) => acc + Math.pow(b.length.value - meanVal, 2), 0) / billets.length;
  const stdDev = Math.sqrt(variance);

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="trending-up" size={18} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>LIVE LENGTH VARIANCE TREND</Text>
        </View>
      </View>

      {/* SVG Trend Line Chart */}
      <View style={styles.chartContainer}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Tolerance Band background (green tint) */}
          <Rect
            x={paddingLeft}
            y={upperLimitY}
            width={innerWidth}
            height={Math.max(1, lowerLimitY - upperLimitY)}
            fill="rgba(16, 185, 129, 0.08)"
            rx={2}
          />

          {/* Upper Tolerance Limit (+5mm) */}
          <Line
            x1={paddingLeft}
            y1={upperLimitY}
            x2={chartWidth - paddingRight}
            y2={upperLimitY}
            stroke="#EF4444"
            strokeDasharray="4 3"
            strokeWidth="1.2"
          />
          <SvgText
            x={paddingLeft - 4}
            y={upperLimitY + 3.5}
            fill="#EF4444"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            +{tol}
          </SvgText>

          {/* Nominal Center Line (0mm) */}
          <Line
            x1={paddingLeft}
            y1={nominalY}
            x2={chartWidth - paddingRight}
            y2={nominalY}
            stroke="#94A3B8"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <SvgText
            x={paddingLeft - 4}
            y={nominalY + 3.5}
            fill="#64748B"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            0
          </SvgText>

          {/* Lower Tolerance Limit (-5mm) */}
          <Line
            x1={paddingLeft}
            y1={lowerLimitY}
            x2={chartWidth - paddingRight}
            y2={lowerLimitY}
            stroke="#EF4444"
            strokeDasharray="4 3"
            strokeWidth="1.2"
          />
          <SvgText
            x={paddingLeft - 4}
            y={lowerLimitY + 3.5}
            fill="#EF4444"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            -{tol}
          </SvgText>

          {/* Live Trend Polyline */}
          <Polyline
            points={points}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {billets.map((b, i) => {
            const cx = getX(i);
            const cy = getY(b.length.value);
            const diff = Math.abs(b.length.value - nominal);
            const isOutOfTol = diff > tol;
            const isWarning = diff > tol * 0.8 && !isOutOfTol;
            const isLatest = i === billets.length - 1;

            let dotColor = '#0284C7';
            if (isOutOfTol) dotColor = '#EF4444';
            else if (isWarning) dotColor = '#F59E0B';
            else dotColor = '#10B981';

            return (
              <React.Fragment key={b.id + i}>
                {isLatest && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={6.5}
                    fill="none"
                    stroke={dotColor}
                    strokeWidth="1.5"
                    opacity={0.6}
                  />
                )}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isLatest ? 4 : isOutOfTol ? 4 : 3}
                  fill={dotColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* 4-Stat Metric Summary Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LATEST DEVIATION</Text>
          <Text
            style={[
              styles.statValue,
              { color: isLatestInTol ? '#059669' : '#DC2626' },
            ]}
          >
            {latestDiffStr} mm
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SAMPLE MEAN (μ)</Text>
          <Text style={styles.statValue}>{meanVal.toFixed(1)} mm</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>STD DEV (σ)</Text>
          <Text style={styles.statValue}>±{stdDev.toFixed(2)} mm</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>IN-TOLERANCE</Text>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {(
              (billets.filter((b) => Math.abs(b.length.value - nominal) <= tol).length /
                billets.length) *
              100
            ).toFixed(0)}
            %
          </Text>
        </View>
      </View>
    </View>
  );
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
    marginBottom: SPACING.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  chartContainer: {
    marginVertical: 4,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#0F172A',
  },
});

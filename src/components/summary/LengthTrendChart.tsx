import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet } from '../../types/inspection';

interface LengthTrendChartProps {
  recentBillets: Billet[];
}

export const LengthTrendChart: React.FC<LengthTrendChartProps> = ({ recentBillets }) => {
  const data = [...recentBillets].slice(0, 14).reverse();

  if (data.length === 0) {
    return null;
  }

  const chartHeight = 130;
  const chartWidth = 330;
  const paddingLeft = 56;
  const paddingRight = 14;
  const paddingTop = 16;
  const paddingBottom = 18;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const nominal = data[0]?.length.nominal || 1000;
  const tol = data[0]?.length.tolerance || 5;

  const rangeMargin = 3.5;
  const minVal = nominal - tol - rangeMargin;
  const maxVal = nominal + tol + rangeMargin;
  const range = maxVal - minVal;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / range;
    return paddingTop + (innerHeight - ratio * innerHeight);
  };

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const points = data.map((b, i) => `${getX(i).toFixed(1)},${getY(b.length.value).toFixed(1)}`).join(' ');

  const upperLimitY = getY(nominal + tol);
  const nominalY = getY(nominal);
  const lowerLimitY = getY(nominal - tol);

  const latestBillet = data[data.length - 1];
  const latestVal = latestBillet ? latestBillet.length.value : nominal;
  const latestDiff = latestVal - nominal;
  const isLatestInTol = Math.abs(latestDiff) <= tol;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>LENGTH VARIANCE TREND</Text>
        <Text style={styles.legendText}>
          Tolerance Band: {nominal - tol} – {nominal + tol} mm (±{tol} mm)
        </Text>
      </View>

      <View style={styles.chartWrapper}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Tolerance Band background (green zone) */}
          <Rect
            x={paddingLeft}
            y={upperLimitY}
            width={innerWidth}
            height={Math.max(1, lowerLimitY - upperLimitY)}
            fill="rgba(5, 150, 105, 0.09)"
            rx={3}
          />

          {/* Upper Tolerance Limit (+5 mm / 1005 mm) */}
          <Line
            x1={paddingLeft}
            y1={upperLimitY}
            x2={chartWidth - paddingRight}
            y2={upperLimitY}
            stroke={COLORS.fail}
            strokeDasharray="4 3"
            strokeWidth="1.2"
          />
          <SvgText
            x={paddingLeft - 6}
            y={upperLimitY + 3.5}
            fill={COLORS.fail}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            {nominal + tol} mm
          </SvgText>

          {/* Nominal Center Line (1000 mm) */}
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
            x={paddingLeft - 6}
            y={nominalY + 3.5}
            fill="#64748B"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            {nominal} mm
          </SvgText>

          {/* Lower Tolerance Limit (-5 mm / 995 mm) */}
          <Line
            x1={paddingLeft}
            y1={lowerLimitY}
            x2={chartWidth - paddingRight}
            y2={lowerLimitY}
            stroke={COLORS.fail}
            strokeDasharray="4 3"
            strokeWidth="1.2"
          />
          <SvgText
            x={paddingLeft - 6}
            y={lowerLimitY + 3.5}
            fill={COLORS.fail}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="end"
          >
            {nominal - tol} mm
          </SvgText>

          {/* Trend Polyline */}
          <Polyline
            points={points}
            fill="none"
            stroke={COLORS.interactive}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {data.map((b, i) => {
            const cx = getX(i);
            const cy = getY(b.length.value);
            const isOutOfTol = Math.abs(b.length.value - nominal) > tol;
            const isLatest = i === data.length - 1;

            return (
              <React.Fragment key={b.id + i}>
                {isLatest && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={6.5}
                    fill="none"
                    stroke={isOutOfTol ? COLORS.fail : COLORS.interactive}
                    strokeWidth="1.5"
                    opacity={0.6}
                  />
                )}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isLatest ? 4 : isOutOfTol ? 4 : 3}
                  fill={isOutOfTol ? COLORS.fail : COLORS.interactive}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Dimensional Scale Summary Bar Under the Chart */}
      <View style={styles.scaleBar}>
        <View style={styles.scaleItem}>
          <Text style={styles.scaleLabel}>LOWER LIMIT</Text>
          <Text style={styles.scaleValRed}>{nominal - tol}.0 mm</Text>
        </View>

        <View style={styles.scaleDivider} />

        <View style={styles.scaleItem}>
          <Text style={styles.scaleLabel}>TARGET</Text>
          <Text style={styles.scaleVal}>{nominal}.0 mm</Text>
        </View>

        <View style={styles.scaleDivider} />

        <View style={styles.scaleItem}>
          <Text style={styles.scaleLabel}>UPPER LIMIT</Text>
          <Text style={styles.scaleValRed}>{nominal + tol}.0 mm</Text>
        </View>

        <View style={styles.scaleDivider} />

        <View style={styles.scaleItem}>
          <Text style={styles.scaleLabel}>LATEST MEASURED</Text>
          <Text style={[styles.scaleVal, { color: isLatestInTol ? COLORS.pass : COLORS.fail }]}>
            {latestVal.toFixed(1)} mm
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  legendText: {
    fontSize: 9.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#0F172A',
    fontWeight: '700',
  },
  chartWrapper: {
    marginVertical: SPACING.xs,
    alignItems: 'center',
  },
  scaleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  scaleItem: {
    flex: 1,
    alignItems: 'center',
  },
  scaleDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  scaleLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  scaleVal: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#0F172A',
  },
  scaleValRed: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.fail,
  },
});


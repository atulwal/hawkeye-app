import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet } from '../../types/inspection';

interface LengthTrendChartProps {
  recentBillets: Billet[];
}

export const LengthTrendChart: React.FC<LengthTrendChartProps> = ({ recentBillets }) => {
  const data = [...recentBillets].slice(0, 12).reverse();

  if (data.length === 0) {
    return null;
  }

  const chartHeight = 110;
  const chartWidth = 300;
  const nominal = data[0]?.length.nominal || 1000;
  const tol = data[0]?.length.tolerance || 5;

  const minVal = nominal - tol - 3;
  const maxVal = nominal + tol + 3;
  const range = maxVal - minVal;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / range;
    return chartHeight - ratio * chartHeight;
  };

  const stepX = chartWidth / Math.max(1, data.length - 1);
  const points = data.map((b, i) => `${i * stepX},${getY(b.length.value)}`).join(' ');

  const upperLimitY = getY(nominal + tol);
  const nominalY = getY(nominal);
  const lowerLimitY = getY(nominal - tol);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>LENGTH VARIANCE TREND</Text>
      </View>

      <View style={styles.chartWrapper}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Tolerance Band background */}
          <Rect
            x="0"
            y={upperLimitY}
            width={chartWidth}
            height={lowerLimitY - upperLimitY}
            fill="rgba(5, 150, 105, 0.08)"
          />

          {/* Upper Tolerance Limit Line */}
          <Line
            x1="0"
            y1={upperLimitY}
            x2={chartWidth}
            y2={upperLimitY}
            stroke={COLORS.fail}
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Nominal Center Line */}
          <Line
            x1="0"
            y1={nominalY}
            x2={chartWidth}
            y2={nominalY}
            stroke="#CBD5E1"
            strokeWidth="1"
          />

          {/* Lower Tolerance Limit Line */}
          <Line
            x1="0"
            y1={lowerLimitY}
            x2={chartWidth}
            y2={lowerLimitY}
            stroke={COLORS.fail}
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Trend Polyline */}
          <Polyline
            points={points}
            fill="none"
            stroke={COLORS.interactive}
            strokeWidth="2.5"
          />

          {/* Data Points */}
          {data.map((b, i) => {
            const isOutOfTol = Math.abs(b.length.value - nominal) > tol;
            return (
              <Circle
                key={b.id}
                cx={i * stepX}
                cy={getY(b.length.value)}
                r={isOutOfTol ? 4.5 : 3}
                fill={isOutOfTol ? COLORS.fail : COLORS.interactive}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}
        </Svg>
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
    marginBottom: SPACING.sm,
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
  chartWrapper: {
    marginVertical: SPACING.xs,
    alignItems: 'center',
  },
  footerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textMuted,
  },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet } from '../../types/inspection';

interface WidthDistributionProps {
  history: Billet[];
}

interface WidthBin {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export const WidthDistribution: React.FC<WidthDistributionProps> = ({ history }) => {
  const nominal = history[0]?.width?.nominal ?? 150;
  const tolerance = history[0]?.width?.tolerance ?? 2;

  const total = history.length;

  // Define 6 bins based on nominal and tolerance
  // 1: < (nominal - tol) [Undersize]
  // 2: [nominal - tol, nominal - tol/2)
  // 3: [nominal - tol/2, nominal)
  // 4: [nominal, nominal + tol/2)
  // 5: [nominal + tol/2, nominal + tol]
  // 6: > (nominal + tol) [Oversize]
  const lowerLimit = nominal - tolerance;
  const midLower = nominal - tolerance / 2;
  const midUpper = nominal + tolerance / 2;
  const upperLimit = nominal + tolerance;

  const precision = 1;

  const bins: WidthBin[] = [
    {
      label: `< ${lowerLimit.toFixed(precision)} (Undersize)`,
      count: 0,
      pct: 0,
      color: '#DC2626', // Red
    },
    {
      label: `${lowerLimit.toFixed(precision)} – ${(midLower - 0.1).toFixed(precision)} mm`,
      count: 0,
      pct: 0,
      color: '#2563EB', // Blue
    },
    {
      label: `${midLower.toFixed(precision)} – ${(nominal - 0.1).toFixed(precision)} mm`,
      count: 0,
      pct: 0,
      color: '#15803D', // Green
    },
    {
      label: `${nominal.toFixed(precision)} – ${(midUpper - 0.1).toFixed(precision)} mm`,
      count: 0,
      pct: 0,
      color: '#15803D', // Green
    },
    {
      label: `${midUpper.toFixed(precision)} – ${upperLimit.toFixed(precision)} mm`,
      count: 0,
      pct: 0,
      color: '#2563EB', // Blue
    },
    {
      label: `> ${upperLimit.toFixed(precision)} (Oversize)`,
      count: 0,
      pct: 0,
      color: '#DC2626', // Red
    },
  ];

  history.forEach((b) => {
    const val = b.width.value;
    if (val < lowerLimit) {
      bins[0].count++;
    } else if (val < midLower) {
      bins[1].count++;
    } else if (val < nominal) {
      bins[2].count++;
    } else if (val < midUpper) {
      bins[3].count++;
    } else if (val <= upperLimit) {
      bins[4].count++;
    } else {
      bins[5].count++;
    }
  });

  // Calculate percentages
  bins.forEach((bin) => {
    bin.pct = total > 0 ? Math.round((bin.count / total) * 100) : 0;
  });

  return (
    <View style={styles.card}>
      {/* Title Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="bar-chart-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.title}>Billet Width Distribution (mm)</Text>
        </View>
        <Text style={styles.nominalText}>
          Nominal: {nominal.toFixed(1)} ± {tolerance.toFixed(1)} mm
        </Text>
      </View>

      {/* Distribution Bars */}
      <View style={styles.listContainer}>
        {bins.map((bin, index) => (
          <View key={index} style={styles.row}>
            {/* Left Label */}
            <Text style={styles.binLabel} numberOfLines={1}>
              {bin.label}
            </Text>

            {/* Middle Bar Track */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: bin.color,
                    width: `${Math.max(bin.count > 0 ? 3 : 0, bin.pct)}%`,
                  },
                ]}
              />
            </View>

            {/* Right Count and Percentage */}
            <Text style={styles.countText}>
              {bin.count} ({bin.pct}%)
            </Text>
          </View>
        ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  nominalText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#64748B',
    fontWeight: '600',
  },
  listContainer: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  binLabel: {
    width: 140,
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#334155',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  countText: {
    width: 60,
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
});

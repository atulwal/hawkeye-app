import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface DefectCount {
  name: string;
  count: number;
  pct: number;
}

interface DefectDistributionProps {
  defects: DefectCount[];
}

export const DefectDistribution: React.FC<DefectDistributionProps> = ({ defects }) => {
  if (defects.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>DEFECT DISTRIBUTION</Text>
        </View>
        <Text style={styles.emptyText}>Zero defect anomalies logged in this production shift.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>DEFECT CATEGORY BREAKDOWN</Text>
      </View>

      {defects.map((d, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemHeader}>
            <View style={styles.defectTag}>
              <Text style={styles.defectName}>{d.name}</Text>
            </View>
            <Text style={styles.defectCount}>
              {d.count} units ({d.pct}%)
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(100, Math.max(10, d.pct))}%` }]} />
          </View>
        </View>
      ))}
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
    alignItems: 'center',
    marginBottom: SPACING.md,
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
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.pass,
    fontWeight: '600',
    paddingVertical: 4,
  },
  itemRow: {
    marginBottom: SPACING.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  defectTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defectName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  defectCount: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  barTrack: {
    height: 7,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.rework,
    borderRadius: 4,
  },
});

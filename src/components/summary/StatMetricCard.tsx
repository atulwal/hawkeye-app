import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface StatMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'pass' | 'rework' | 'fail' | 'neutral';
}

export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  label,
  value,
  subValue,
  variant = 'neutral',
}) => {
  const config = {
    pass: {
      color: COLORS.pass,
      bg: COLORS.passMuted,
      border: COLORS.passBorder,
    },
    rework: {
      color: COLORS.rework,
      bg: COLORS.reworkMuted,
      border: COLORS.reworkBorder,
    },
    fail: {
      color: COLORS.fail,
      bg: COLORS.failMuted,
      border: COLORS.failBorder,
    },
    neutral: {
      color: COLORS.textPrimary,
      bg: COLORS.surfaceSubtle,
      border: COLORS.border,
    },
  }[variant];

  return (
    <View style={[styles.card, { borderColor: config.border, backgroundColor: COLORS.surface }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={[styles.value, { color: config.color }]}>{value}</Text>
      {Boolean(subValue) && <Text style={styles.subValue}>{subValue}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginVertical: 2,
  },
  subValue: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});


import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Measurement, getDelta, isMeasurementInTolerance } from '../../types/inspection';

interface MeasurementRowProps {
  label: string;
  measurement: Measurement;
  unit?: string;
  isCompact?: boolean;
}

export const MeasurementRow: React.FC<MeasurementRowProps> = ({
  label,
  measurement,
  unit = 'mm',
  isCompact = false,
}) => {
  const inTolerance = isMeasurementInTolerance(measurement);
  const delta = getDelta(measurement);
  const deltaSign = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={styles.labelCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.nominal}>
          {measurement.nominal} ±{measurement.tolerance} {unit}
        </Text>
      </View>

      <View style={styles.valueCol}>
        <Text
          style={[
            styles.value,
            { color: inTolerance ? COLORS.textPrimary : COLORS.fail },
          ]}
        >
          {measurement.value.toFixed(1)} <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text
          style={[
            styles.delta,
            { color: inTolerance ? COLORS.textSecondary : COLORS.fail },
          ]}
        >
          {deltaSign} {unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  containerCompact: {
    paddingVertical: SPACING.xs,
  },
  labelCol: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nominal: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginTop: 2,
  },
  valueCol: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  unit: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  delta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginTop: 2,
  },
});

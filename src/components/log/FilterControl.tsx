import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { HistoryFilterType } from '../../types/inspection';

interface FilterControlProps {
  activeFilter: HistoryFilterType;
  onSelectFilter: (filter: HistoryFilterType) => void;
  counts?: {
    ALL: number;
    PASS: number;
    REWORK: number;
    FAIL: number;
    UNACKNOWLEDGED: number;
  };
}

export const FilterControl: React.FC<FilterControlProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const filters: { key: HistoryFilterType; label: string; icon: any }[] = [
    { key: 'ALL', label: 'ALL', icon: 'grid-outline' },
    { key: 'PASS', label: 'PASS', icon: 'checkmark-circle-outline' },
    { key: 'REWORK', label: 'REWORK', icon: 'alert-circle-outline' },
    { key: 'FAIL', label: 'FAIL', icon: 'close-circle-outline' },
    { key: 'UNACKNOWLEDGED', label: 'UNACK', icon: 'warning-outline' },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filters.map((f) => {
          const isSelected = activeFilter === f.key;
          const count = counts ? counts[f.key] : undefined;

          const iconColor = isSelected
            ? f.key === 'UNACKNOWLEDGED' || f.key === 'FAIL'
              ? COLORS.fail
              : f.key === 'REWORK'
              ? COLORS.rework
              : f.key === 'PASS'
              ? COLORS.pass
              : COLORS.interactive
            : COLORS.textMuted;

          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterPill,
                isSelected && styles.filterPillActive,
                f.key === 'UNACKNOWLEDGED' && isSelected && styles.unackPillActive,
                f.key === 'FAIL' && isSelected && styles.failPillActive,
                f.key === 'REWORK' && isSelected && styles.reworkPillActive,
                f.key === 'PASS' && isSelected && styles.passPillActive,
              ]}
              onPress={() => onSelectFilter(f.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon} size={15} color={iconColor} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.filterLabel,
                  isSelected && styles.filterLabelActive,
                  f.key === 'UNACKNOWLEDGED' && isSelected && { color: COLORS.fail },
                  f.key === 'FAIL' && isSelected && { color: COLORS.fail },
                  f.key === 'REWORK' && isSelected && { color: COLORS.rework },
                  f.key === 'PASS' && isSelected && { color: COLORS.pass },
                ]}
              >
                {f.label}
              </Text>
              {count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected && styles.countBadgeActive,
                    f.key === 'UNACKNOWLEDGED' && count > 0 && styles.unackCountBadge,
                    f.key === 'PASS' && isSelected && styles.passCountBadge,
                    f.key === 'REWORK' && isSelected && styles.reworkCountBadge,
                    f.key === 'FAIL' && isSelected && styles.failCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.countTextActive,
                      f.key === 'UNACKNOWLEDGED' && count > 0 && { color: '#FFF' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TOUCH_TARGET.minHeight,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.interactiveMuted,
    borderColor: COLORS.interactive,
  },
  passPillActive: {
    backgroundColor: COLORS.passMuted,
    borderColor: COLORS.passBorder,
  },
  reworkPillActive: {
    backgroundColor: COLORS.reworkMuted,
    borderColor: COLORS.reworkBorder,
  },
  failPillActive: {
    backgroundColor: COLORS.failMuted,
    borderColor: COLORS.failBorder,
  },
  unackPillActive: {
    backgroundColor: COLORS.failMuted,
    borderColor: COLORS.failBorder,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  filterLabelActive: {
    color: COLORS.interactive,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSubtle,
  },
  countBadgeActive: {
    backgroundColor: COLORS.interactive,
  },
  passCountBadge: {
    backgroundColor: COLORS.pass,
  },
  reworkCountBadge: {
    backgroundColor: COLORS.rework,
  },
  failCountBadge: {
    backgroundColor: COLORS.fail,
  },
  unackCountBadge: {
    backgroundColor: COLORS.fail,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textSecondary,
  },
  countTextActive: {
    color: '#FFF',
  },
});

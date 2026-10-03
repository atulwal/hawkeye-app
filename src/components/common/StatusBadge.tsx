import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { Status } from '../../types/inspection';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const config = {
    PASS: {
      bg: COLORS.pass,
      border: COLORS.pass,
      text: '#FFFFFF',
      label: 'PASS',
    },
    REWORK: {
      bg: COLORS.rework,
      border: COLORS.rework,
      text: '#FFFFFF',
      label: 'REWORK',
    },
    FAIL: {
      bg: COLORS.fail,
      border: COLORS.fail,
      text: '#FFFFFF',
      label: 'FAIL',
    },
  }[status] || {
    bg: COLORS.surfaceSubtle,
    border: COLORS.border,
    text: COLORS.textSecondary,
    label: status,
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSm ? 3 : isLg ? 7 : 5,
          paddingHorizontal: isSm ? 8 : isLg ? 14 : 10,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSm ? TYPOGRAPHY.fontSize.xs : isLg ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.sm,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 0,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: 0.5,
  },
});

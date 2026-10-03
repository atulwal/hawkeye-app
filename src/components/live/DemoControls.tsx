import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { Status } from '../../types/inspection';

interface DemoControlsProps {
  onTriggerDemo: (status: Status) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({ onTriggerDemo }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>DEMO TEST INJECTION TOOLBAR</Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.demoBtn, styles.passBtn]}
          onPress={() => onTriggerDemo('PASS')}
          activeOpacity={0.7}
        >
          <Text style={styles.passBtnText}>Simulate PASS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoBtn, styles.reworkBtn]}
          onPress={() => onTriggerDemo('REWORK')}
          activeOpacity={0.7}
        >
          <Text style={styles.reworkBtnText}>Simulate REWORK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoBtn, styles.failBtn]}
          onPress={() => onTriggerDemo('FAIL')}
          activeOpacity={0.7}
        >
          <Text style={styles.failBtnText}>Simulate FAIL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  demoBtn: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  passBtn: {
    backgroundColor: COLORS.passMuted,
    borderColor: COLORS.passBorder,
  },
  passBtnText: {
    color: COLORS.pass,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  reworkBtn: {
    backgroundColor: COLORS.reworkMuted,
    borderColor: COLORS.reworkBorder,
  },
  reworkBtnText: {
    color: COLORS.rework,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  failBtn: {
    backgroundColor: COLORS.failMuted,
    borderColor: COLORS.failBorder,
  },
  failBtnText: {
    color: COLORS.fail,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
});

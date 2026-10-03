import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TOUCH_TARGET } from '../../constants/theme';

interface IndustrialHeaderProps {
  isAdmin?: boolean;
  onPressAdminAuth?: () => void;
  audioEnabled?: boolean;
  onToggleAudio?: (enabled: boolean) => void;
}

export const IndustrialHeader: React.FC<IndustrialHeaderProps> = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) + SPACING.xs }]}>
      <View style={styles.topRow}>
        <Image
          source={require('../../../assets/images/hawkeye-wordmark-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surfaceNavy,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A3B5C',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.minHeight,
  },
  logo: {
    width: 155,
    height: 32,
  },
});

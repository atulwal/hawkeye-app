import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';

interface IndustrialHeaderProps {
  isAdmin?: boolean;
  onPressAdminAuth?: () => void;
  audioEnabled?: boolean;
  onToggleAudio?: (enabled: boolean) => void;
}

export const IndustrialHeader: React.FC<IndustrialHeaderProps> = ({
  isAdmin,
  onPressAdminAuth,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) + SPACING.xs }]}>
      <View style={styles.topRow}>
        <Image
          source={require('../../../assets/images/hawkeye-wordmark-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Top Right Navbar: Admin Login / PIN auth */}
        <View style={styles.rightNavContainer}>
          {!isAdmin ? (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={onPressAdminAuth}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.adminLoginBtnText}>Admin Login</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.adminActiveBadge}
              onPress={onPressAdminAuth}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={13} color="#34D399" style={{ marginRight: 4 }} />
              <Text style={styles.adminActiveText}>ADMIN ACTIVE</Text>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.minHeight,
  },
  logo: {
    width: 145,
    height: 30,
  },
  rightNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: 0.3,
  },
  adminActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminActiveText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: 0.5,
  },
});

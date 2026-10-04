import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { settingsService } from '../../services/settingsService';
import { Billet, getDisplayedId } from '../../types/inspection';

interface LiveCameraFeedProps {
  billet: Billet | null;
  onSnapshotTaken?: (uri: string) => void;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({ billet }) => {
  const [permission, requestPermission] = useCameraPermissions();

  // Animation for laser scanline
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [scanAnim] = useState(() => new Animated.Value(0));

  // Pulse animation for live recording dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Scanline laser animation
  useEffect(() => {
    const scan = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    scan.start();
    return () => scan.stop();
  }, [scanAnim]);

  const statusColor = billet
    ? {
        PASS: COLORS.pass,
        REWORK: COLORS.rework,
        FAIL: COLORS.fail,
      }[billet.status]
    : COLORS.interactive;

  const displayedId = billet ? getDisplayedId(billet) : 'SCANNING...';
  const lengthStr = billet ? `${billet.length.value.toFixed(1)} mm` : '-- mm';

  return (
    <View style={styles.container}>
      {/* Header bar on camera card */}
      <View style={styles.cardTopHeader}>
        <View style={styles.camTitleGroup}>
          <Animated.View
            style={[
              styles.recordingDot,
              {
                opacity: pulseAnim,
                backgroundColor: permission?.granted ? '#10B981' : '#38BDF8',
              },
            ]}
          />
          <Text style={styles.cardTopTitle}>LIVE INSPECTION CAMERA 01</Text>
        </View>
      </View>

      {/* Main Viewport */}
      <View style={styles.viewport}>
        {/* Native Camera Viewport */}
        {permission?.granted ? (
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
            />
            {/* Animated Laser Scanning Line */}
            <Animated.View
              style={[
                styles.laserScanline,
                {
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 200],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        ) : (
          <View style={styles.permissionPromptContainer}>
            <Ionicons name="camera-outline" size={38} color="#38BDF8" style={{ marginBottom: 10 }} />
            <Text style={styles.permissionTitle}>Enable Device Camera</Text>
            <Text style={styles.permissionSubtitle}>
              Allow camera permission to inspect billets directly using your device hardware.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.permissionBtnText}>ALLOW CAMERA ACCESS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Precision Dimension Blueprint Overlay */}
        <View style={styles.dimensionWrapper}>
          <View style={styles.dimArrowLeft} />
          <View style={styles.dimLine} />
          <View style={styles.dimensionPill}>
            <Text style={styles.dimensionText}>Length: {lengthStr}</Text>
          </View>
          <View style={styles.dimLine} />
          <View style={styles.dimArrowRight} />
        </View>

        {/* Industrial Bounding Box Corner Brackets */}
        <View style={styles.boundingBox}>
          <Svg width={20} height={20} style={[styles.bracket, styles.bracketTL]}>
            <Path d="M 0 20 L 0 0 L 20 0" stroke={statusColor} strokeWidth="3" fill="none" />
          </Svg>
          <Svg width={20} height={20} style={[styles.bracket, styles.bracketTR]}>
            <Path d="M 0 0 L 20 0 L 20 20" stroke={statusColor} strokeWidth="3" fill="none" />
          </Svg>
          <Svg width={20} height={20} style={[styles.bracket, styles.bracketBL]}>
            <Path d="M 0 0 L 0 20 L 20 20" stroke={statusColor} strokeWidth="3" fill="none" />
          </Svg>
          <Svg width={20} height={20} style={[styles.bracket, styles.bracketBR]}>
            <Path d="M 0 20 L 20 20 L 20 0" stroke={statusColor} strokeWidth="3" fill="none" />
          </Svg>

          {/* Live ID Tag Floating at Top of Bounding Box */}
          <View style={styles.floatingIdTag}>
            <Text style={styles.floatingIdText}>{displayedId}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  camTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cardTopTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTopFps: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeToggleActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: COLORS.interactive,
  },
  modeToggleSim: {
    backgroundColor: COLORS.surfaceSubtle,
    borderColor: COLORS.border,
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textMuted,
  },
  modeToggleTextActive: {
    color: COLORS.interactive,
  },
  viewport: {
    height: 220,
    backgroundColor: COLORS.conveyorBg,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  liveVideoImage: {
    width: '100%',
    height: '100%',
  },
  videoScanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  overlayTop: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusChipLive: {
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  statusPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#38BDF8',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statusChipTextLive: {
    color: '#34D399',
  },
  calibratedChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  calibratedText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dimensionWrapper: {
    position: 'absolute',
    top: 40,
    flexDirection: 'row',
    alignItems: 'center',
    width: '84%',
    zIndex: 15,
  },
  dimLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dimensionLine,
  },
  dimArrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: COLORS.dimensionLine,
  },
  dimArrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.dimensionLine,
  },
  dimensionPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.dimensionLine,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dimensionText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.dimensionLine,
  },
  billetMotionWrapper: {
    width: '84%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  billetBody: {
    width: '100%',
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  steelHighlight: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  steelStripe1: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  steelStripe2: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  billetIdPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  billetIdText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  boundingBox: {
    position: 'absolute',
    top: 68,
    bottom: 24,
    left: '8%',
    right: '8%',
    pointerEvents: 'none',
    zIndex: 12,
  },
  bracket: {
    position: 'absolute',
  },
  bracketTL: { top: 0, left: 0 },
  bracketTR: { top: 0, right: 0 },
  bracketBL: { bottom: 0, left: 0 },
  bracketBR: { bottom: 0, right: 0 },
  floatingIdTag: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  floatingIdText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  laserScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    zIndex: 10,
  },
  miniControlBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniControlBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#FBBF24',
  },
  permissionPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: '#0F172A',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    marginBottom: 4,
  },
  permissionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
    maxWidth: 240,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.interactive,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
});

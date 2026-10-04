import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId } from '../../types/inspection';

interface CameraMockProps {
  billet: Billet | null;
}

export const CameraMock: React.FC<CameraMockProps> = ({ billet }) => {
  const [slideAnim] = useState(() => new Animated.Value(-120));
  const [opacityAnim] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    if (billet) {
      slideAnim.setValue(-80);
      opacityAnim.setValue(0.5);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [billet, slideAnim, opacityAnim]);

  const statusColor = billet
    ? {
        PASS: COLORS.pass,
        REWORK: COLORS.rework,
        FAIL: COLORS.fail,
      }[billet.status]
    : COLORS.textMuted;

  const displayedId = billet ? getDisplayedId(billet) : 'SCANNING...';
  const lengthStr = billet ? `${billet.length.value.toFixed(1)} mm` : '-- mm';

  return (
    <View style={styles.container}>
      {/* Header bar on camera card */}
      <View style={styles.cardTopHeader}>
        <View style={styles.camTitleGroup}>
          <View style={styles.recordingDot} />
          <Text style={styles.cardTopTitle}>LIVE INSPECTION CAMERA 01</Text>
        </View>
      </View>

      {/* Conveyor Viewport */}
      <View style={styles.viewport}>
        {/* Rollers SVG */}
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          {/* Grid guidelines */}
          <Line x1="0" y1="50%" x2="100%" y2="50%" stroke="#16202E" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="#16202E" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Bottom rollers */}
          {[20, 60, 100, 140, 180, 220, 260, 300, 340].map((x) => (
            <Rect
              key={x}
              x={x}
              y="160"
              width="24"
              height="35"
              fill="#131B26"
              stroke="#1E293B"
              strokeWidth="1"
              rx="2"
            />
          ))}
        </Svg>

        {/* Top Badges: MOCK DATA Chip */}
        <View style={styles.overlayTop}>
          <View style={styles.mockChip}>
            <View style={styles.mockPulse} />
            <Text style={styles.mockChipText}>MOCK DATA</Text>
          </View>
          <View style={styles.calibratedChip}>
            <Text style={styles.calibratedText}>CALIBRATED 2.45 px/mm</Text>
          </View>
        </View>

        {/* Billet Object & Bounding Box */}
        {billet && (
          <Animated.View
            style={[
              styles.billetMotionWrapper,
              {
                transform: [{ translateX: slideAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Dimension Blueprint Line Above Billet */}
            <View style={styles.dimensionWrapper}>
              <View style={styles.dimArrowLeft} />
              <View style={styles.dimLine} />
              <View style={styles.dimensionPill}>
                <Text style={styles.dimensionText}>Length: {lengthStr}</Text>
              </View>
              <View style={styles.dimLine} />
              <View style={styles.dimArrowRight} />
            </View>

            {/* Steel Billet Graphic */}
            <View style={styles.billetBody}>
              {/* Brushed steel surface lines */}
              <View style={styles.steelHighlight} />
              <View style={styles.steelStripe1} />
              <View style={styles.steelStripe2} />

              {/* Centered ID Pill on the steel surface */}
              <View style={styles.billetIdPill}>
                <Text style={styles.billetIdText}>{displayedId}</Text>
              </View>
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
            </View>
          </Animated.View>
        )}
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.fail,
    marginRight: 6,
  },
  cardTopTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  cardTopFps: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  viewport: {
    height: 200,
    backgroundColor: COLORS.conveyorBg,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
  mockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  mockPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  mockChipText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#38BDF8',
    fontWeight: '700',
    letterSpacing: 0.8,
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
  billetMotionWrapper: {
    width: '84%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dimensionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
  billetBody: {
    width: '100%',
    height: 56,
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
    top: 22,
    bottom: -8,
    left: -10,
    right: -10,
    pointerEvents: 'none',
  },
  bracket: {
    position: 'absolute',
  },
  bracketTL: { top: 0, left: 0 },
  bracketTR: { top: 0, right: 0 },
  bracketBL: { bottom: 0, left: 0 },
  bracketBR: { bottom: 0, right: 0 },
});

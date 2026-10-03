import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import {
  cameraStreamService,
  StreamFrame,
  StreamStats,
  StreamStatus,
} from '../../services/cameraStreamService';
import { settingsService } from '../../services/settingsService';
import { Billet, getDisplayedId } from '../../types/inspection';

interface LiveCameraFeedProps {
  billet: Billet | null;
  onSnapshotTaken?: (uri: string) => void;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  billet,
}) => {
  const [streamFrame, setStreamFrame] = useState<StreamFrame | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(cameraStreamService.getStatus());
  const [stats, setStats] = useState<StreamStats>(cameraStreamService.getStats());
  const [forcedMode, setForcedMode] = useState<'AUTO' | 'WEBCAM' | 'MOCK'>('AUTO');

  // Animation for mock billet sliding
  const [slideAnim] = useState(() => new Animated.Value(-120));
  const [opacityAnim] = useState(() => new Animated.Value(0.4));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    settingsService.getStreamConfig().then((cfg) => {
      setForcedMode(cfg.cameraMode || 'AUTO');
    });

    const unsubFrame = cameraStreamService.subscribe((frame) => {
      setStreamFrame(frame);
    });

    const unsubStatus = cameraStreamService.subscribeStatus((status, newStats) => {
      setStreamStatus(status);
      setStats(newStats);
    });

    return () => {
      unsubFrame();
      unsubStatus();
    };
  }, []);

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

  // Motion animation when a new billet arrives in mock mode
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

  const hasActiveWebcam = Boolean(
    streamFrame && (streamStatus === 'CONNECTED' || Boolean(streamFrame.uri))
  );

  const isLiveMode =
    forcedMode === 'WEBCAM' || (forcedMode === 'AUTO' && hasActiveWebcam);

  const statusColor = billet
    ? {
        PASS: COLORS.pass,
        REWORK: COLORS.rework,
        FAIL: COLORS.fail,
      }[billet.status]
    : COLORS.interactive;

  const displayedId = billet ? getDisplayedId(billet) : 'SCANNING...';
  const lengthStr = billet ? `${billet.length.value.toFixed(1)} mm` : '-- mm';

  const toggleMode = () => {
    const nextMode = isLiveMode ? 'MOCK' : 'AUTO';
    setForcedMode(nextMode);
    settingsService.getStreamConfig().then((cfg) => {
      settingsService.saveStreamConfig({ ...cfg, cameraMode: nextMode });
    });
    if (nextMode === 'AUTO' && streamStatus === 'OFFLINE') {
      cameraStreamService.connect();
    }
  };

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
                backgroundColor: isLiveMode ? '#10B981' : COLORS.fail,
              },
            ]}
          />
          <Text style={styles.cardTopTitle}>
            {isLiveMode ? 'LIVE WEBCAM STREAM' : 'SIMULATED CONVEYOR 01'}
          </Text>
        </View>

        <View style={styles.topRightControls}>
          <Text style={styles.cardTopFps}>
            {isLiveMode
              ? `${stats.fps || 30} FPS · ${stats.latencyMs ? `${stats.latencyMs}ms` : 'SYNC'}`
              : '60 FPS · 1080p HD'}
          </Text>
          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              isLiveMode ? styles.modeToggleActive : styles.modeToggleSim,
            ]}
            onPress={toggleMode}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiveMode ? 'videocam' : 'cube-outline'}
              size={12}
              color={isLiveMode ? '#38BDF8' : '#94A3B8'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.modeToggleText, isLiveMode && styles.modeToggleTextActive]}>
              {isLiveMode ? 'LIVE' : 'SIM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Viewport */}
      <View style={styles.viewport}>
        {/* Case 1: LIVE WEBCAM VIDEO FEED */}
        {isLiveMode && streamFrame ? (
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: streamFrame.uri }}
              style={styles.liveVideoImage}
              contentFit="cover"
              transition={0}
              cachePolicy="none"
            />
            {/* Subtle camera scanline overlay */}
            <View style={styles.videoScanlineOverlay} />
          </View>
        ) : (
          /* Case 2: SIMULATED CONVEYOR GRAPHIC */
          <>
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

            {/* Simulated Billet Object */}
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
                {/* Steel Billet Graphic */}
                <View style={styles.billetBody}>
                  <View style={styles.steelHighlight} />
                  <View style={styles.steelStripe1} />
                  <View style={styles.steelStripe2} />
                  <View style={styles.billetIdPill}>
                    <Text style={styles.billetIdText}>{displayedId}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* TOP STATUS BADGES OVERLAY */}
        <View style={styles.overlayTop}>
          <View style={[styles.statusChip, isLiveMode && styles.statusChipLive]}>
            <View
              style={[
                styles.statusPulse,
                { backgroundColor: isLiveMode ? '#34D399' : '#38BDF8' },
              ]}
            />
            <Text style={[styles.statusChipText, isLiveMode && styles.statusChipTextLive]}>
              {isLiveMode ? 'WEBCAM SYNCED' : 'MOCK ENGINE'}
            </Text>
          </View>

          <View style={styles.calibratedChip}>
            <Text style={styles.calibratedText}>CALIBRATED 2.45 px/mm</Text>
          </View>
        </View>

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

        {/* Offline notice when Webcam mode is active but stream is offline */}
        {forcedMode === 'WEBCAM' && !hasActiveWebcam && (
          <View style={styles.offlineBanner}>
            <Ionicons name="warning-outline" size={14} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.offlineText}>
              Webcam feed offline. Start bridge server or switch to SIM.
            </Text>
          </View>
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
  offlineBanner: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBBF24',
    zIndex: 20,
  },
  offlineText: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '600',
  },
});

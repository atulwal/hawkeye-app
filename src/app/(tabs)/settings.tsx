import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IndustrialHeader } from '../../components/common/IndustrialHeader';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { cameraStreamService, StreamStatus } from '../../services/cameraStreamService';
import { mockInspectionService } from '../../services/mockInspectionService';
import { CameraMode, settingsService } from '../../services/settingsService';
import { ToleranceConfig } from '../../types/inspection';

export default function SettingsScreen() {
  const {
    isAdmin,
    openPinModal,
    audioEnabled,
    setAudioEnabled,
  } = useApp();

  // Dimensional tolerances
  const [lengthNom, setLengthNom] = useState('1000');
  const [lengthTol, setLengthTol] = useState('5');

  const [widthNom, setWidthNom] = useState('120');
  const [widthTol, setWidthTol] = useState('1');

  const [heightNom, setHeightNom] = useState('120');
  const [heightTol, setHeightTol] = useState('1');

  const [ocrThreshold, setOcrThreshold] = useState('90');
  const [pixelsPerMm, setPixelsPerMm] = useState('2.45');

  // Webcam & Stream Sync settings
  const [streamUrl, setStreamUrl] = useState('ws://192.168.137.129:8080');
  const [cameraMode, setCameraMode] = useState<CameraMode>('AUTO');
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(cameraStreamService.getStatus());
  const [pingResult, setPingResult] = useState<{ testing: boolean; latency?: number; error?: string } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    mockInspectionService.getTolerances().then((cfg) => {
      setLengthNom(String(cfg.length.nominal));
      setLengthTol(String(cfg.length.tolerance));
      setWidthNom(String(cfg.width.nominal));
      setWidthTol(String(cfg.width.tolerance));
      setHeightNom(String(cfg.height.nominal));
      setHeightTol(String(cfg.height.tolerance));
      setOcrThreshold(String(Math.round(cfg.ocrThreshold * 100)));
      setPixelsPerMm(String(cfg.pixelsPerMm));
    });

    settingsService.getStreamConfig().then((streamCfg) => {
      setStreamUrl(streamCfg.streamUrl || 'ws://192.168.137.129:8080');
      setCameraMode(streamCfg.cameraMode || 'AUTO');
    });

    const unsubStream = cameraStreamService.subscribeStatus((status) => {
      setStreamStatus(status);
    });

    return () => {
      unsubStream();
    };
  }, []);

  const handleTestStreamConnection = async () => {
    setPingResult({ testing: true });
    const result = await cameraStreamService.pingTest(streamUrl);
    if (result.success) {
      setPingResult({ testing: false, latency: result.latencyMs });
      cameraStreamService.connect(streamUrl);
    } else {
      setPingResult({ testing: false, error: result.error || 'Connection failed' });
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }

    const lNom = parseFloat(lengthNom);
    const lTol = parseFloat(lengthTol);
    const wNom = parseFloat(widthNom);
    const wTol = parseFloat(widthTol);
    const hNom = parseFloat(heightNom);
    const hTol = parseFloat(heightTol);
    const ocr = parseFloat(ocrThreshold) / 100;
    const pxMm = parseFloat(pixelsPerMm);

    if (
      isNaN(lNom) || isNaN(lTol) ||
      isNaN(wNom) || isNaN(wTol) ||
      isNaN(hNom) || isNaN(hTol) ||
      isNaN(ocr) || isNaN(pxMm)
    ) {
      setErrorMessage('Please enter valid numeric values for all parameters');
      return;
    }

    const newConfig: ToleranceConfig = {
      length: { nominal: lNom, tolerance: lTol },
      width: { nominal: wNom, tolerance: wTol },
      height: { nominal: hNom, tolerance: hTol },
      ocrThreshold: ocr,
      pixelsPerMm: pxMm,
    };

    try {
      await mockInspectionService.updateTolerances(newConfig, 'Admin');
      await settingsService.saveStreamConfig({
        streamUrl: streamUrl.trim(),
        autoConnect: true,
        cameraMode,
      });

      // Update active stream connection
      cameraStreamService.connect(streamUrl.trim());

      setErrorMessage(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      setErrorMessage('Failed to save configuration');
    }
  };

  return (
    <View style={styles.container}>
      <IndustrialHeader
        isAdmin={isAdmin}
        onPressAdminAuth={openPinModal}
        audioEnabled={audioEnabled}
        onToggleAudio={setAudioEnabled}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SYSTEM & VISION ENGINE CONFIGURATION</Text>
            <Text style={styles.sectionSubtitle}>
              Manage dimensional thresholds, live website webcam synchronization, and camera calibration
            </Text>
          </View>

          {/* Success banner */}
          {saveSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.pass} style={{ marginRight: 6 }} />
              <Text style={styles.successText}>
                Configuration and stream settings saved and applied.
              </Text>
            </View>
          )}

          {/* Error banner */}
          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={COLORS.fail} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* LIVE WEBCAM & STREAM SYNC CARD */}
          <View style={[styles.card, styles.streamCard]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="videocam-outline" size={16} color={COLORS.interactive} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeading}>WEBCAM LIVE FEED SYNCHRONIZATION</Text>
            </View>
            <Text style={styles.cardDesc}>
              Stream live video frames from your website webcam directly to this mobile app in real-time.
            </Text>

            {/* Stream Status Indicator */}
            <View style={styles.statusPillRow}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        streamStatus === 'CONNECTED'
                          ? COLORS.pass
                          : streamStatus === 'CONNECTING'
                          ? COLORS.rework
                          : COLORS.textMuted,
                    },
                  ]}
                />
                <Text style={styles.statusLabel}>
                  Status: {streamStatus === 'CONNECTED' ? 'ONLINE (SYNCED)' : streamStatus}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={handleTestStreamConnection}
                disabled={pingResult?.testing}
              >
                <Text style={styles.testBtnText}>
                  {pingResult?.testing ? 'Testing...' : 'Test Connection'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ping Result Banner */}
            {pingResult && !pingResult.testing && (
              <View
                style={[
                  styles.pingBadge,
                  pingResult.latency !== undefined ? styles.pingSuccess : styles.pingError,
                ]}
              >
                <Ionicons
                  name={pingResult.latency !== undefined ? 'checkmark-circle' : 'alert-circle'}
                  size={14}
                  color={pingResult.latency !== undefined ? COLORS.pass : COLORS.fail}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.pingText,
                    { color: pingResult.latency !== undefined ? COLORS.pass : COLORS.fail },
                  ]}
                >
                  {pingResult.latency !== undefined
                    ? `Connected successfully (${pingResult.latency}ms latency)`
                    : pingResult.error}
                </Text>
              </View>
            )}

            {/* WebSocket Stream URL Input */}
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={styles.inputLabel}>Stream Bridge Server URL</Text>
              <TextInput
                style={styles.input}
                value={streamUrl}
                onChangeText={setStreamUrl}
                placeholder="ws://192.168.137.129:8080"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHelpText}>
                Use <Text style={{ fontWeight: '700' }}>ws://localhost:8080</Text> on web or{' '}
                <Text style={{ fontWeight: '700' }}>ws://192.168.137.129:8080</Text> on physical phones.
              </Text>
            </View>

            {/* Camera Mode Selector */}
            <View style={{ marginTop: SPACING.md }}>
              <Text style={styles.inputLabel}>Camera Display Mode</Text>
              <View style={styles.modeRow}>
                {(['AUTO', 'WEBCAM', 'MOCK'] as CameraMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeOption,
                      cameraMode === mode && styles.modeOptionActive,
                    ]}
                    onPress={() => setCameraMode(mode)}
                  >
                    <Text
                      style={[
                        styles.modeOptionText,
                        cameraMode === mode && styles.modeOptionTextActive,
                      ]}
                    >
                      {mode === 'AUTO'
                        ? 'Auto (Smart Sync)'
                        : mode === 'WEBCAM'
                        ? 'Webcam Only'
                        : 'Simulated'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Length Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardHeading}>LENGTH SPECIFICATION (MM)</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Nominal Target</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={lengthNom}
                  onChangeText={setLengthNom}
                  placeholder="1000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Allowable ± Tol</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={lengthTol}
                  onChangeText={setLengthTol}
                  placeholder="5"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
            <Text style={styles.rangePreview}>
              PASS range: {(parseFloat(lengthNom) || 1000) - (parseFloat(lengthTol) || 5)} mm –{' '}
              {(parseFloat(lengthNom) || 1000) + (parseFloat(lengthTol) || 5)} mm
            </Text>
          </View>

          {/* Width Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardHeading}>WIDTH SPECIFICATION (MM)</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Nominal Target</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={widthNom}
                  onChangeText={setWidthNom}
                  placeholder="120"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Allowable ± Tol</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={widthTol}
                  onChangeText={setWidthTol}
                  placeholder="1"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Height / Diameter Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardHeading}>HEIGHT / DIAMETER SPECIFICATION (MM)</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Nominal Target</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={heightNom}
                  onChangeText={setHeightNom}
                  placeholder="120"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Allowable ± Tol</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={heightTol}
                  onChangeText={setHeightTol}
                  placeholder="1"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* OCR Confidence Threshold */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardHeading}>OCR & SYSTEM CALIBRATION</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Min OCR Confidence (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={ocrThreshold}
                  onChangeText={setOcrThreshold}
                  placeholder="90"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Calibration (px/mm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={pixelsPerMm}
                  onChangeText={setPixelsPerMm}
                  placeholder="2.45"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
            <Text style={styles.rangePreview}>
              OCR confidence readings below {ocrThreshold || 90}% trigger REWORK status for review.
            </Text>
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            style={[styles.saveBtn, !isAdmin && styles.saveBtnLocked]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAdmin ? 'save-outline' : 'lock-closed'}
              size={18}
              color="#FFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.saveBtnText}>
              {isAdmin ? 'SAVE CONFIGURATION & STREAM' : 'UNLOCK ADMIN TO SAVE'}
            </Text>
          </TouchableOpacity>

          {/* System Telemetry & Health Card */}
          <View style={styles.systemInfoCard}>
            <Text style={styles.systemInfoTitle}>SYSTEM TELEMETRY</Text>
            <View style={styles.systemInfoRow}>
              <Text style={styles.infoKey}>Camera Pipeline</Text>
              <Text style={styles.infoVal}>
                {cameraMode === 'MOCK' ? 'Simulated Conveyor' : 'Webcam Live Stream (Synced)'}
              </Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.infoKey}>Stream Endpoint</Text>
              <Text style={styles.infoVal}>{streamUrl}</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.infoKey}>Calibration Ratio</Text>
              <Text style={styles.infoVal}>{pixelsPerMm} px/mm</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.infoKey}>Storage Engine</Text>
              <Text style={styles.infoVal}>AsyncStorage (Local Persistent)</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.infoKey}>Active Theme</Text>
              <Text style={styles.infoVal}>Light Mode (Bayin Style)</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.passMuted,
    borderWidth: 1,
    borderColor: COLORS.passBorder,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  successText: {
    color: COLORS.pass,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.failMuted,
    borderWidth: 1,
    borderColor: COLORS.failBorder,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.fail,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  streamCard: {
    borderColor: 'rgba(2, 132, 199, 0.3)',
    backgroundColor: '#FAFCFE',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  statusPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
  },
  testBtn: {
    backgroundColor: COLORS.interactive,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  testBtnText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },
  pingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  pingSuccess: {
    backgroundColor: COLORS.passMuted,
  },
  pingError: {
    backgroundColor: COLORS.failMuted,
  },
  pingText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSubtle,
  },
  modeOptionActive: {
    borderColor: COLORS.interactive,
    backgroundColor: COLORS.interactiveMuted,
  },
  modeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modeOptionTextActive: {
    color: COLORS.interactive,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  inputHelpText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: TOUCH_TARGET.minHeight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  rangePreview: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.interactive,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  saveBtn: {
    height: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.interactive,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    ...SHADOWS.card,
  },
  saveBtnLocked: {
    backgroundColor: '#64748B',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  systemInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  systemInfoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  infoKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});

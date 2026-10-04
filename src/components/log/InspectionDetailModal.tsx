import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId, isAcknowledged } from '../../types/inspection';
import { MeasurementRow } from '../common/MeasurementRow';
import { StatusBadge } from '../common/StatusBadge';

interface InspectionDetailModalProps {
  visible: boolean;
  billet: Billet | null;
  isAdmin: boolean;
  onClose: () => void;
  onRequestAdminAuth: () => void;
  onSaveCorrection: (billetId: string, newId: string, reason?: string) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  visible,
  billet,
  isAdmin,
  onClose,
  onRequestAdminAuth,
  onSaveCorrection,
}) => {
  const [isEditingId, setIsEditingId] = useState(false);
  const [newIdInput, setNewIdInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!billet) return null;

  const displayedId = getDisplayedId(billet);
  const ack = isAcknowledged(billet);
  const hasCorrections = billet.corrections && billet.corrections.length > 0;

  const handleStartEdit = () => {
    if (!isAdmin) {
      onRequestAdminAuth();
      return;
    }
    setNewIdInput(displayedId);
    setReasonInput('');
    setError(null);
    setIsEditingId(true);
  };

  const handleSaveCorrection = () => {
    const trimmed = newIdInput.trim().toUpperCase();
    const idRegex = /^BLT-\d{4}-\d{4}$/;

    if (!idRegex.test(trimmed)) {
      setError('Format must match: BLT-YYYY-NNNN (e.g. BLT-2026-1042)');
      return;
    }

    onSaveCorrection(billet.id, trimmed, reasonInput);
    setIsEditingId(false);
    setError(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>INSPECTION RECORD</Text>
              <Text style={styles.headerId}>{displayedId}</Text>
            </View>
            <View style={styles.headerRight}>
              <StatusBadge status={billet.status} size="md" />
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* OCR & Identification Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>OPTICAL CHARACTER RECOGNITION</Text>
                {isAdmin && !isEditingId && (
                  <TouchableOpacity
                    style={styles.editIdBtn}
                    onPress={handleStartEdit}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil"
                      size={12}
                      color={COLORS.interactive}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.editIdBtnText}>Edit ID</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditingId ? (
                <View style={styles.editContainer}>
                  <Text style={styles.editHint}>
                    Raw OCR ({billet.ocrId}) will be permanently preserved in the immutable audit trail.
                  </Text>
                  <TextInput
                    style={[styles.input, Boolean(error) && styles.inputError]}
                    value={newIdInput}
                    onChangeText={(val) => {
                      setNewIdInput(val);
                      if (error) setError(null);
                    }}
                    placeholder="BLT-2026-NNNN"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    autoFocus
                  />
                  {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

                  <TextInput
                    style={styles.reasonInput}
                    value={reasonInput}
                    onChangeText={setReasonInput}
                    placeholder="Correction reason (e.g. Visual stamp inspection)"
                    placeholderTextColor={COLORS.textMuted}
                  />

                  <View style={styles.editBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={() => setIsEditingId(false)}
                    >
                      <Text style={styles.cancelEditText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveEditBtn}
                      onPress={handleSaveCorrection}
                    >
                      <Text style={styles.saveEditText}>Save Correction</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.ocrInfoGrid}>
                  <View style={styles.ocrInfoCol}>
                    <Text style={styles.metaLabel}>RAW OCR RESULT</Text>
                    <Text style={styles.metaValMono}>{billet.ocrId}</Text>
                  </View>
                  <View style={styles.ocrInfoCol}>
                    <Text style={styles.metaLabel}>CONFIDENCE SCORE</Text>
                    <Text
                      style={[
                        styles.metaValMono,
                        { color: billet.ocrConfidence >= 0.9 ? COLORS.pass : COLORS.rework },
                      ]}
                    >
                      {Math.round(billet.ocrConfidence * 100)}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Correction History */}
              {hasCorrections && (
                <View style={styles.correctionAuditBox}>
                  <Text style={styles.auditTitle}>AUDIT CORRECTION LOG</Text>
                  {billet.corrections.map((c, idx) => (
                    <View key={idx} style={styles.auditItem}>
                      <Text style={styles.auditText}>
                        Updated to <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{c.newId}</Text> by {c.by}
                      </Text>
                      <Text style={styles.auditTime}>
                        {new Date(c.at).toLocaleString()} · {c.reason || 'Manual override'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Dimensional Telemetry */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>DIMENSIONAL MEASUREMENTS</Text>
              <MeasurementRow label="Length" measurement={billet.length} />
              <MeasurementRow label="Width" measurement={billet.width} />
              <MeasurementRow label="Height / Diam." measurement={billet.height} />
            </View>

            {/* Defects & Quality Flags */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>SURFACE & DEFECT AUDIT</Text>
              {billet.defects.length > 0 ? (
                <View style={styles.defectsList}>
                  {billet.defects.map((d, i) => (
                    <View key={i} style={styles.defectPill}>
                      <Text style={styles.defectPillText}>{d}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDefectsText}>No surface anomalies detected</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  headerId: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2942',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  adminLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  adminActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminActiveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  editIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.interactiveMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.interactive,
  },
  editIdBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.interactive,
  },
  ocrInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ocrInfoCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaValMono: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    marginTop: 2,
    fontWeight: '700',
  },
  editContainer: {
    marginTop: SPACING.xs,
  },
  editHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: TOUCH_TARGET.minHeight,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.fail,
  },
  errorText: {
    color: COLORS.fail,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  reasonInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: TOUCH_TARGET.minHeight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  editBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelEditBtn: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelEditText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  saveEditBtn: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.interactive,
  },
  saveEditText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
  },
  correctionAuditBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  auditTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.interactive,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  auditItem: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  auditText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  auditTime: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  defectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  defectPill: {
    backgroundColor: COLORS.rework,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  defectPillText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: 0.5,
  },
  noDefectsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.pass,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});

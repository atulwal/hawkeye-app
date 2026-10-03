import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId, isAcknowledged } from '../../types/inspection';
import { StatusBadge } from '../common/StatusBadge';

interface InspectionCardProps {
  billet: Billet;
  onPress: () => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ billet, onPress }) => {
  const displayedId = getDisplayedId(billet);
  const ack = isAcknowledged(billet);
  const isCorrected = billet.corrections && billet.corrections.length > 0;

  return (
    <TouchableOpacity
      style={[styles.card, billet.status === 'FAIL' && !ack && styles.cardUnackFail]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.idGroup}>
          <Text style={styles.idText}>{displayedId}</Text>
          {isCorrected && (
            <View style={styles.correctedChip}>
              <Text style={styles.correctedText}>EDITED</Text>
            </View>
          )}
        </View>

        <StatusBadge status={billet.status} size="sm" />
      </View>

      {/* Dimensions Readout */}
      <View style={styles.dimRow}>
        <View style={styles.dimItem}>
          <Text style={styles.dimLabel}>L:</Text>
          <Text style={styles.dimVal}>{billet.length.value.toFixed(1)}</Text>
        </View>
        <View style={styles.dimItem}>
          <Text style={styles.dimLabel}>W:</Text>
          <Text style={styles.dimVal}>{billet.width.value.toFixed(1)}</Text>
        </View>
        <View style={styles.dimItem}>
          <Text style={styles.dimLabel}>H:</Text>
          <Text style={styles.dimVal}>{billet.height.value.toFixed(1)}</Text>
        </View>
        <Text style={styles.unitText}>mm</Text>
      </View>

      {/* Footer Info: Timestamp, OCR %, Ack state */}
      <View style={styles.footerRow}>
        <Text style={styles.timeText}>
          {new Date(billet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>

        <View style={styles.footerRight}>
          {billet.status === 'FAIL' ? (
            ack ? (
              <View style={styles.ackChip}>
                <Ionicons name="checkmark-done" size={12} color={COLORS.pass} style={{ marginRight: 3 }} />
                <Text style={styles.ackText}>{billet.acknowledgedBy || 'Ack'}</Text>
              </View>
            ) : (
              <View style={styles.unackChip}>
                <Text style={styles.unackText}>UNACKNOWLEDGED</Text>
              </View>
            )
          ) : (
            <Text style={styles.ocrText}>{Math.round(billet.ocrConfidence * 100)}% OCR</Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardUnackFail: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textPrimary,
  },
  correctedChip: {
    backgroundColor: COLORS.interactiveMuted,
    borderWidth: 1,
    borderColor: COLORS.interactive,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  correctedText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.interactive,
    fontWeight: '800',
  },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dimItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 3,
    fontWeight: '700',
  },
  dimVal: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.passMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.passBorder,
  },
  ackText: {
    fontSize: 10,
    color: COLORS.pass,
    fontWeight: '700',
  },
  unackChip: {
    backgroundColor: COLORS.failMuted,
    borderWidth: 1,
    borderColor: COLORS.failBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unackText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.fail,
    letterSpacing: 0.5,
  },
  ocrText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId, isMeasurementInTolerance } from '../../types/inspection';

interface AlertBannerProps {
  billet: Billet;
  onAcknowledge: (billet: Billet) => void;
  onViewDetails: (billet: Billet) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  billet,
  onAcknowledge,
  onViewDetails,
}) => {
  let failedLabel = 'Dimension';
  let failedVal = 0;
  let failedNom = 0;
  let failedTol = 0;

  if (!isMeasurementInTolerance(billet.length)) {
    failedLabel = 'Length';
    failedVal = billet.length.value;
    failedNom = billet.length.nominal;
    failedTol = billet.length.tolerance;
  } else if (!isMeasurementInTolerance(billet.width)) {
    failedLabel = 'Width';
    failedVal = billet.width.value;
    failedNom = billet.width.nominal;
    failedTol = billet.width.tolerance;
  } else if (!isMeasurementInTolerance(billet.height)) {
    failedLabel = 'Height';
    failedVal = billet.height.value;
    failedNom = billet.height.nominal;
    failedTol = billet.height.tolerance;
  }

  const delta = Number((failedVal - failedNom).toFixed(1));
  const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
  const displayedId = getDisplayedId(billet);

  return (
    <View style={styles.alertCard}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.alertHeading}>OUT OF TOLERANCE ALARM</Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(billet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.idSection}>
          <Text style={styles.idLabel}>BILLET ID</Text>
          <Text style={styles.idValue}>{displayedId}</Text>
        </View>

        <View style={styles.specSection}>
          <Text style={styles.specLabel}>{failedLabel.toUpperCase()}</Text>
          <Text style={styles.specValue}>
            {failedVal.toFixed(1)} mm{' '}
            <Text style={styles.deltaValue}>({deltaSign} mm)</Text>
          </Text>
          <Text style={styles.limitValue}>
            Limit: {failedNom} ±{failedTol} mm
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => onViewDetails(billet)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ackButton}
          onPress={() => onAcknowledge(billet)}
          activeOpacity={0.8}
        >
          <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.alert,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertHeading: {
    color: '#B91C1C',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#991B1B',
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingVertical: 4,
  },
  idSection: {
    flex: 1,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '800',
    color: '#7F1D1D',
    marginTop: 2,
  },
  specSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  deltaValue: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: '#DC2626',
  },
  limitValue: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#7F1D1D',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  detailsButton: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#991B1B',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
  },
  ackButton: {
    flex: 1.6,
    height: TOUCH_TARGET.minHeight,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackButtonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { Billet, getDisplayedId, isMeasurementInTolerance } from '../../types/inspection';

interface AlertBannerProps {
  billet: Billet;
  onAcknowledge: (billet: Billet) => void;
  onViewDetails?: (billet: Billet) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  billet,
  onAcknowledge,
  onViewDetails,
}) => {
  let failedLabel = 'Dimension';
  let failedVal = 0;

  if (!isMeasurementInTolerance(billet.length)) {
    failedLabel = 'Length';
    failedVal = billet.length.value;
  } else if (!isMeasurementInTolerance(billet.width)) {
    failedLabel = 'Width';
    failedVal = billet.width.value;
  } else if (!isMeasurementInTolerance(billet.height)) {
    failedLabel = 'Height';
    failedVal = billet.height.value;
  }

  const displayedId = getDisplayedId(billet);

  return (
    <View style={styles.alertCard}>
      {/* 1. Header: Out of Tolerance Alarm */}
      <View style={styles.headerRow}>
        <Text style={styles.alertHeading}>OUT OF TOLERANCE ALARM</Text>
      </View>

      {/* 2. Middle: Billet ID & Out-of-Tolerance Parameter / Value */}
      <View style={styles.bodyRow}>
        <View style={styles.idSection}>
          <Text style={styles.idLabel}>BILLET ID</Text>
          <Text style={styles.idValue}>{displayedId}</Text>
        </View>

        <View style={styles.specSection}>
          <Text style={styles.specLabel}>{failedLabel.toUpperCase()}</Text>
          <Text style={styles.specValue}>{failedVal.toFixed(1)} mm</Text>
        </View>
      </View>

      {/* 3. Bottom: View Details & Acknowledge Action Buttons */}
      <View style={styles.actionRow}>
        {onViewDetails && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onViewDetails(billet)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}

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
    marginBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingBottom: 6,
  },
  alertHeading: {
    color: '#B91C1C',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
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
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});



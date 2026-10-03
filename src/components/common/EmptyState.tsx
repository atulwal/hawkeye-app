import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface EmptyStateProps {
  type: 'loading' | 'empty' | 'no-results' | 'error';
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
}) => {
  if (type === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.interactive} style={styles.spinner} />
        <Text style={styles.title}>{title || 'Loading Telemetry...'}</Text>
        <Text style={styles.description}>
          {description || 'Connecting to inspection stream'}
        </Text>
      </View>
    );
  }

  const iconName = {
    empty: 'cube-outline',
    'no-results': 'search-outline',
    error: 'alert-circle-outline',
  }[type] as any;

  const iconColor = {
    empty: COLORS.textMuted,
    'no-results': COLORS.interactive,
    error: COLORS.fail,
  }[type];

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={30} color={iconColor} />
      </View>
      <Text style={styles.title}>
        {title || (type === 'no-results' ? 'No Matching Records' : type === 'error' ? 'Stream Error' : 'No Records Available')}
      </Text>
      <Text style={styles.description}>
        {description || (type === 'no-results' ? 'Try adjusting your search query or active status filter' : 'Inspections will appear as billets move through the line')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    minHeight: 200,
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});

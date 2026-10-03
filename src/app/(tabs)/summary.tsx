import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { IndustrialHeader } from '../../components/common/IndustrialHeader';
import { DefectDistribution } from '../../components/summary/DefectDistribution';
import { LengthTrendChart } from '../../components/summary/LengthTrendChart';
import { StatMetricCard } from '../../components/summary/StatMetricCard';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { mockInspectionService } from '../../services/mockInspectionService';
import { Billet } from '../../types/inspection';

export default function QualitySummaryScreen() {
  const {
    isAdmin,
    openPinModal,
    audioEnabled,
    setAudioEnabled,
  } = useApp();

  const [history, setHistory] = useState<Billet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await mockInspectionService.getHistory();
      setHistory(data);
    } catch (e) {
      console.error('Failed to load quality summary:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    mockInspectionService.getHistory().then((data) => {
      if (isMounted) {
        setHistory(data);
        setLoading(false);
      }
    });

    const unsubscribe = mockInspectionService.subscribeToLiveFeed(() => {
      if (isMounted) {
        mockInspectionService.getHistory().then((data) => {
          if (isMounted) setHistory(data);
        });
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Compute metrics
  const total = history.length;
  const passCount = history.filter((b) => b.status === 'PASS').length;
  const reworkCount = history.filter((b) => b.status === 'REWORK').length;
  const failCount = history.filter((b) => b.status === 'FAIL').length;

  const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0.0';
  const reworkRate = total > 0 ? ((reworkCount / total) * 100).toFixed(1) : '0.0';
  const failRate = total > 0 ? ((failCount / total) * 100).toFixed(1) : '0.0';

  // Compute defect counts
  const defectMap: Record<string, number> = {};
  history.forEach((b) => {
    b.defects.forEach((d) => {
      defectMap[d] = (defectMap[d] || 0) + 1;
    });
  });

  const defectList = Object.entries(defectMap)
    .map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <View style={styles.container}>
      <IndustrialHeader
        isAdmin={isAdmin}
        onPressAdminAuth={openPinModal}
        audioEnabled={audioEnabled}
        onToggleAudio={setAudioEnabled}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={COLORS.interactive}
          />
        }
      >
        {loading ? (
          <EmptyState type="loading" title="Calculating Yield Analytics..." />
        ) : (
          <>
            {/* Bayin-inspired Hero Card: Total Inspected & Yield Banner */}
            <View style={styles.heroSummaryCard}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroSubtitle}>PRODUCTION YIELD OVERVIEW</Text>
                  <Text style={styles.heroTotalCount}>{total} <Text style={styles.heroTotalUnit}>Billets</Text></Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroBottomRow}>
                <View style={styles.heroMetaItem}>
                  <Text style={styles.heroMetaLabel}>Standard Nominal</Text>
                  <Text style={styles.heroMetaValue}>1000 ±5 mm</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Text style={styles.heroMetaLabel}>Width / Diameter</Text>
                  <Text style={styles.heroMetaValue}>120 ±1 mm</Text>
                </View>
                <View style={styles.heroMetaItem}>
                  <Text style={styles.heroMetaLabel}>Min OCR Score</Text>
                  <Text style={styles.heroMetaValueActive}>90% Target</Text>
                </View>
              </View>
            </View>

            {/* Quick Metrics 3-Card Row */}
            <View style={styles.metricsRow}>
              <StatMetricCard
                label="Passed"
                value={passCount}
                subValue={`${passRate}%`}
                variant="pass"
                icon="checkmark-circle"
              />
              <StatMetricCard
                label="Rework"
                value={reworkCount}
                subValue={`${reworkRate}%`}
                variant="rework"
                icon="alert-circle"
              />
              <StatMetricCard
                label="Rejected"
                value={failCount}
                subValue={`${failRate}%`}
                variant="fail"
                icon="close-circle"
              />
            </View>

            {/* Length Variance Trend Chart */}
            <LengthTrendChart recentBillets={history} />

            {/* Defect Distribution Breakdown */}
            <DefectDistribution defects={defectList} />

            {/* Shift Quick Actions / Settings Links */}
            <View style={styles.quickLinksCard}>
              <Text style={styles.quickLinksTitle}>SYSTEM SHORTCUTS</Text>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/(tabs)/log')}
                activeOpacity={0.7}
              >
                <View style={styles.linkIconCol}>
                  <Ionicons name="list" size={18} color={COLORS.interactive} />
                </View>
                <View style={styles.linkTextCol}>
                  <Text style={styles.linkLabel}>Inspection Log & CSV Export</Text>
                  <Text style={styles.linkSub}>View full history and export production records</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/(tabs)/settings')}
                activeOpacity={0.7}
              >
                <View style={styles.linkIconCol}>
                  <Ionicons name="options" size={18} color={COLORS.interactive} />
                </View>
                <View style={styles.linkTextCol}>
                  <Text style={styles.linkLabel}>Tolerance Limits & Calibration</Text>
                  <Text style={styles.linkSub}>Configure dimensional targets and camera calibration</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  heroSummaryCard: {
    backgroundColor: COLORS.surfaceNavy,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  heroTotalCount: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroTotalUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: SPACING.md,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetaItem: {
    flex: 1,
  },
  heroMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  heroMetaValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroMetaValueActive: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickLinksCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  quickLinksTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkIconCol: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.interactiveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  linkTextCol: {
    flex: 1,
  },
  linkLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  linkSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

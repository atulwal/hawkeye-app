import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { IndustrialHeader } from '../../components/common/IndustrialHeader';
import { FilterControl } from '../../components/log/FilterControl';
import { InspectionCard } from '../../components/log/InspectionCard';
import { InspectionDetailModal } from '../../components/log/InspectionDetailModal';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { mockInspectionService } from '../../services/mockInspectionService';
import { Billet, HistoryFilterType, getDisplayedId, isAcknowledged } from '../../types/inspection';

export default function InspectionRecordsScreen() {
  const {
    isAdmin,
    openPinModal,
    audioEnabled,
    setAudioEnabled,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('ALL');
  const [activeDefect, setActiveDefect] = useState<string>('ALL');
  const [records, setRecords] = useState<Billet[]>([]);
  const [allRawRecords, setAllRawRecords] = useState<Billet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [selectedBillet, setSelectedBillet] = useState<Billet | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const all = await mockInspectionService.getHistory();
      setAllRawRecords(all);

      const filtered = await mockInspectionService.getHistory({
        status: activeFilter,
        defect: activeDefect,
        searchQuery,
      });
      setRecords(filtered);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, activeDefect, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    mockInspectionService
      .getHistory({ status: activeFilter, defect: activeDefect, searchQuery })
      .then((filtered) => {
        if (isMounted) {
          setRecords(filtered);
          setLoading(false);
        }
      });
    mockInspectionService.getHistory().then((all) => {
      if (isMounted) {
        setAllRawRecords(all);
      }
    });

    const unsubscribe = mockInspectionService.subscribeToLiveFeed(() => {
      if (isMounted) {
        fetchRecords();
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeFilter, activeDefect, searchQuery, fetchRecords]);

  // Compute live counts
  const counts = {
    ALL: allRawRecords.length,
    PASS: allRawRecords.filter((b) => b.status === 'PASS').length,
    REWORK: allRawRecords.filter((b) => b.status === 'REWORK').length,
    FAIL: allRawRecords.filter((b) => b.status === 'FAIL').length,
    UNACKNOWLEDGED: allRawRecords.filter((b) => b.status === 'FAIL' && !isAcknowledged(b)).length,
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportMessage('Preparing CSV export...');

    try {
      // Build CSV header & rows
      const headers = ['timestamp', 'billet_id', 'length_mm', 'width_mm', 'height_mm', 'status', 'acknowledged_by', 'corrected'];
      const rows = records.map((b) => {
        const displayed = getDisplayedId(b);
        const isCorrected = b.corrections && b.corrections.length > 0 ? 'YES' : 'NO';
        return [
          `"${b.timestamp}"`,
          `"${displayed}"`,
          b.length.value.toFixed(1),
          b.width.value.toFixed(1),
          b.height.value.toFixed(1),
          b.status,
          `"${b.acknowledgedBy || ''}"`,
          isCorrected,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const filename = `hawkeye_inspections_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        // Web export fallback
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportMessage(`Exported ${records.length} records (${filename})`);
      } else {
        const file = new File(Paths.cache, filename);
        file.write(csvContent);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Hawkeye Inspection Log',
            UTI: 'public.comma-separated-values-text',
          });
          setExportMessage(`Export ready: ${filename}`);
        } else {
          setExportMessage(`Saved: ${filename}`);
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      setExportMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  const handleSaveCorrection = async (billetId: string, newId: string, reason?: string) => {
    const updated = await mockInspectionService.correctBilletId(billetId, newId, 'Admin', reason);
    setSelectedBillet(updated);
    fetchRecords();
  };

  return (
    <View style={styles.container}>
      <IndustrialHeader
        isAdmin={isAdmin}
        onPressAdminAuth={openPinModal}
        audioEnabled={audioEnabled}
        onToggleAudio={setAudioEnabled}
      />

      <View style={styles.main}>
        {/* Search Bar & Export Button */}
        <View style={styles.searchExportRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Billet ID or defect..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.exportBtnText}>CSV</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Export status notification */}
        {Boolean(exportMessage) && (
          <View style={styles.exportNotification}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.pass} style={{ marginRight: 6 }} />
            <Text style={styles.exportNotificationText}>{exportMessage}</Text>
          </View>
        )}

        {/* Status & Defect Dropdown Filters */}
        <FilterControl
          activeStatus={activeFilter}
          onSelectStatus={setActiveFilter}
          activeDefect={activeDefect}
          onSelectDefect={setActiveDefect}
          defectOptions={Array.from(new Set(allRawRecords.flatMap((b) => b.defects).filter(Boolean)))}
          counts={counts}
        />

        {/* Inspection List */}
        {loading ? (
          <EmptyState type="loading" title="Loading Records..." />
        ) : records.length === 0 ? (
          <EmptyState
            type={searchQuery.length > 0 ? 'no-results' : 'empty'}
            title={searchQuery.length > 0 ? 'No matching billets found' : 'No records for this filter'}
            description={searchQuery.length > 0 ? `No results for "${searchQuery}"` : undefined}
          />
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InspectionCard
                billet={item}
                onPress={() => setSelectedBillet(item)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchRecords();
                }}
                tintColor={COLORS.interactive}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        visible={Boolean(selectedBillet)}
        billet={selectedBillet}
        isAdmin={isAdmin}
        onClose={() => setSelectedBillet(null)}
        onRequestAdminAuth={openPinModal}
        onSaveCorrection={handleSaveCorrection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  main: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  searchExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    height: TOUCH_TARGET.minHeight,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.interactive,
    paddingHorizontal: 16,
    borderRadius: 10,
    ...SHADOWS.sm,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  exportNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.passMuted,
    borderWidth: 1,
    borderColor: COLORS.passBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  exportNotificationText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.pass,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
});

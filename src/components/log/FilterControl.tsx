import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { HistoryFilterType } from '../../types/inspection';

interface FilterControlProps {
  activeStatus: HistoryFilterType;
  onSelectStatus: (status: HistoryFilterType) => void;
  activeDefect: string;
  onSelectDefect: (defect: string) => void;
  defectOptions?: string[];
  counts?: {
    ALL: number;
    PASS: number;
    REWORK: number;
    FAIL: number;
    UNACKNOWLEDGED: number;
  };
}

const STATUS_ITEMS: { key: HistoryFilterType; label: string }[] = [
  { key: 'ALL', label: 'All Statuses' },
  { key: 'PASS', label: 'PASS' },
  { key: 'REWORK', label: 'REWORK' },
  { key: 'FAIL', label: 'FAIL' },
  { key: 'UNACKNOWLEDGED', label: 'Unacknowledged' },
];

export const FilterControl: React.FC<FilterControlProps> = ({
  activeStatus,
  onSelectStatus,
  activeDefect,
  onSelectDefect,
  defectOptions = [],
  counts,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'status' | 'defect' | null>(null);

  const currentStatusLabel =
    STATUS_ITEMS.find((s) => s.key === activeStatus)?.label || 'All Statuses';

  const currentDefectLabel =
    activeDefect === 'ALL' || !activeDefect ? 'All Defects' : activeDefect;

  const defectList = ['ALL', ...defectOptions.filter((d) => d && d !== 'ALL')];

  return (
    <View style={styles.wrapper}>
      {/* Row containing Status and Defect dropdowns */}
      <View style={styles.dropdownsRow}>
        {/* 1. Status Dropdown */}
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Status:</Text>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              activeStatus !== 'ALL' && styles.dropdownButtonActive,
            ]}
            onPress={() => setOpenDropdown('status')}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownButtonText} numberOfLines={1}>
              {currentStatusLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#0F172A" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* 2. Defect Dropdown */}
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Defect:</Text>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              activeDefect !== 'ALL' && styles.dropdownButtonActive,
            ]}
            onPress={() => setOpenDropdown('defect')}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownButtonText} numberOfLines={1}>
              {currentDefectLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#0F172A" style={styles.chevron} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Picker for Status */}
      <Modal
        visible={openDropdown === 'status'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDropdown(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenDropdown(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter by Status</Text>
                  <TouchableOpacity
                    onPress={() => setOpenDropdown(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsList}>
                  {STATUS_ITEMS.map((item) => {
                    const isSelected = activeStatus === item.key;
                    const count = counts ? counts[item.key] : undefined;

                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                        onPress={() => {
                          onSelectStatus(item.key);
                          setOpenDropdown(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionItemText,
                            isSelected && styles.optionItemTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <View style={styles.optionRight}>
                          {count !== undefined && (
                            <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
                              <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                                {count}
                              </Text>
                            </View>
                          )}
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={COLORS.interactive}
                              style={{ marginLeft: 6 }}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Picker for Defect */}
      <Modal
        visible={openDropdown === 'defect'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDropdown(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenDropdown(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter by Defect Type</Text>
                  <TouchableOpacity
                    onPress={() => setOpenDropdown(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.optionsList}>
                    {defectList.map((defect) => {
                      const isAll = defect === 'ALL';
                      const label = isAll ? 'All Defects' : defect;
                      const isSelected = activeDefect === defect;

                      return (
                        <TouchableOpacity
                          key={defect}
                          style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                          onPress={() => {
                            onSelectDefect(defect);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.optionItemText,
                              isSelected && styles.optionItemTextSelected,
                            ]}
                          >
                            {label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={18} color={COLORS.interactive} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  dropdownsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dropdownGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    ...SHADOWS.sm,
  },
  dropdownButtonActive: {
    borderColor: COLORS.interactive,
    backgroundColor: '#F0F9FF',
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  chevron: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  optionsList: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  optionItemSelected: {
    backgroundColor: COLORS.interactiveMuted,
  },
  optionItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionItemTextSelected: {
    color: COLORS.interactive,
    fontWeight: '800',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSubtle,
  },
  countBadgeSelected: {
    backgroundColor: COLORS.interactive,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    color: COLORS.textSecondary,
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
});

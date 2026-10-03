import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../constants/theme';

interface AdminPinModalProps {
  visible: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLogout: () => void;
}

const HARDCODED_MOCK_PIN = '1234';

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  visible,
  isAdmin,
  onClose,
  onSuccess,
  onLogout,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (pin.trim() === HARDCODED_MOCK_PIN) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('Invalid PIN. Use default mock PIN: 1234');
      setPin('');
    }
  };

  const handleClose = () => {
    setError(null);
    setPin('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.titleIcon, { backgroundColor: isAdmin ? COLORS.passMuted : COLORS.interactiveMuted }]}>
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : 'shield-outline'}
                  size={18}
                  color={isAdmin ? COLORS.pass : COLORS.interactive}
                />
              </View>
              <Text style={styles.title}>
                {isAdmin ? 'Admin Session Active' : 'Admin Authorization'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {isAdmin ? (
            <View style={styles.body}>
              <Text style={styles.subtitle}>
                You currently have administrative privileges to configure tolerances, calibration, and correct OCR IDs.
              </Text>
              <TouchableOpacity
                style={styles.lockButton}
                onPress={() => {
                  onLogout();
                  handleClose();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="lock-closed" size={16} color={COLORS.fail} style={{ marginRight: 6 }} />
                <Text style={styles.lockButtonText}>Lock Admin Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={styles.subtitle}>
                Enter the Admin PIN to authorize tolerance limits, calibration parameters, or OCR modifications.
              </Text>
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.interactive} style={{ marginRight: 4 }} />
                <Text style={styles.hintText}>Demo PIN: 1234</Text>
              </View>

              <TextInput
                style={[styles.input, Boolean(error) && styles.inputError]}
                placeholder="••••"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={pin}
                onChangeText={(val) => {
                  setPin(val);
                  if (error) setError(null);
                }}
                autoFocus
                onSubmitEditing={handleSubmit}
              />

              {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, pin.length < 4 && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={pin.length < 4}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Authorize</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  body: {
    paddingVertical: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.interactiveMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.interactive,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    height: 50,
    fontSize: 24,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.fail,
  },
  errorText: {
    color: COLORS.fail,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    height: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.interactive,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TOUCH_TARGET.minHeight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.failBorder,
    backgroundColor: COLORS.failMuted,
    marginTop: SPACING.md,
  },
  lockButtonText: {
    color: COLORS.fail,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
  },
});

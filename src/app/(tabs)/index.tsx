import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { IndustrialHeader } from '../../components/common/IndustrialHeader';
import { AlertBanner } from '../../components/live/AlertBanner';
import { LiveAlertsCard } from '../../components/live/LiveAlertsCard';
import { LiveCameraFeed } from '../../components/live/LiveCameraFeed';
import { LiveTelemetryCard } from '../../components/live/LiveTelemetryCard';
import { InspectionDetailModal } from '../../components/log/InspectionDetailModal';
import { COLORS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { hapticsService } from '../../services/hapticsService';
import { mockInspectionService } from '../../services/mockInspectionService';
import { soundService } from '../../services/soundService';
import { Billet } from '../../types/inspection';

export default function LiveMonitorScreen() {
  const {
    isAdmin,
    openPinModal,
    audioEnabled,
    setAudioEnabled,
    activeAlertBillet,
    setActiveAlertBillet,
  } = useApp();

  const [currentBillet, setCurrentBillet] = useState<Billet | null>(null);
  const [selectedBilletForDetail, setSelectedBilletForDetail] = useState<Billet | null>(null);

  useEffect(() => {
    const unsubscribe = mockInspectionService.subscribeToLiveFeed((billet) => {
      setCurrentBillet(billet);

      // Only FAIL triggers the active alert banner, haptic & audio
      if (billet.status === 'FAIL') {
        setActiveAlertBillet(billet);
        hapticsService.triggerFailHaptic();
        soundService.playFailBeep();
      }
    });

    return () => unsubscribe();
  }, [setActiveAlertBillet]);

  const handleAcknowledge = async (billet: Billet) => {
    try {
      const updated = await mockInspectionService.acknowledgeAlert(billet.id, 'Operator');
      if (currentBillet?.id === billet.id) {
        setCurrentBillet(updated);
      }
      setActiveAlertBillet(null);
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const handleSaveCorrection = async (billetId: string, newId: string, reason?: string) => {
    const updated = await mockInspectionService.correctBilletId(billetId, newId, 'Admin', reason);
    if (currentBillet?.id === billetId) {
      setCurrentBillet(updated);
    }
    setSelectedBilletForDetail(updated);
  };

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
      >
        {/* Pinned FAIL Alert Banner */}
        {activeAlertBillet && (
          <AlertBanner
            billet={activeAlertBillet}
            onAcknowledge={handleAcknowledge}
            onViewDetails={(b) => setSelectedBilletForDetail(b)}
          />
        )}

        {/* Live Camera Viewport (Webcam Stream & Simulation HUD) */}
        <LiveCameraFeed billet={currentBillet} />

        {/* Live Telemetry Card */}
        {currentBillet ? (
          <LiveTelemetryCard billet={currentBillet} />
        ) : (
          <EmptyState type="loading" title="Connecting to Camera Stream..." />
        )}

        {/* Live Alerts Card */}
        <LiveAlertsCard
          onSelectAlert={(billet) => setSelectedBilletForDetail(billet)}
        />
      </ScrollView>

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        visible={Boolean(selectedBilletForDetail)}
        billet={selectedBilletForDetail}
        isAdmin={isAdmin}
        onClose={() => setSelectedBilletForDetail(null)}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
});

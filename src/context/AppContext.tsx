import React, { createContext, useContext, useEffect, useState } from 'react';
import { operatorService } from '../services/operatorService';
import { soundService } from '../services/soundService';
import { Billet } from '../types/inspection';

interface AppContextType {
  operatorName: string;
  setOperatorName: (name: string) => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  activeAlertBillet: Billet | null;
  setActiveAlertBillet: (b: Billet | null) => void;
  isPinModalVisible: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
  isOperatorModalVisible: boolean;
  openOperatorModal: () => void;
  closeOperatorModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operatorName, setOperatorNameState] = useState<string>('Atulya');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabledState] = useState<boolean>(false);
  const [activeAlertBillet, setActiveAlertBillet] = useState<Billet | null>(null);
  const [isPinModalVisible, setIsPinModalVisible] = useState<boolean>(false);
  const [isOperatorModalVisible, setIsOperatorModalVisible] = useState<boolean>(false);

  useEffect(() => {
    operatorService.getOperatorName().then((name) => {
      setOperatorNameState(name);
    });
  }, []);

  const setOperatorName = async (name: string) => {
    setOperatorNameState(name);
    await operatorService.setOperatorName(name);
  };

  const setAudioEnabled = (enabled: boolean) => {
    setAudioEnabledState(enabled);
    soundService.setAudioEnabled(enabled);
  };

  return (
    <AppContext.Provider
      value={{
        operatorName,
        setOperatorName,
        isAdmin,
        setIsAdmin,
        audioEnabled,
        setAudioEnabled,
        activeAlertBillet,
        setActiveAlertBillet,
        isPinModalVisible,
        openPinModal: () => setIsPinModalVisible(true),
        closePinModal: () => setIsPinModalVisible(false),
        isOperatorModalVisible,
        openOperatorModal: () => setIsOperatorModalVisible(true),
        closeOperatorModal: () => setIsOperatorModalVisible(false),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

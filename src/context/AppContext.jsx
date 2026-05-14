import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  closeMovementRecord,
  authenticateOperator as authenticateOperatorUser,
  createMovementRecord,
  deleteActivityType,
  deleteEquipment,
  deleteOperator,
  deleteRecord,
  deleteShift,
  exportData,
  getActivityTypes,
  getDatabase,
  getEquipments,
  getOperators,
  getRecords,
  getSession,
  getSettings,
  getShifts,
  importData,
  loadAppState,
  resetDatabase,
  requestPersistentStorage,
  saveActivityType,
  saveEquipment,
  saveOperator,
  saveRecord,
  saveSession,
  saveShift,
  updateActivityType,
  updateEquipment,
  updateOperator,
  updateRecord,
  updateSettings,
  updateShift,
} from '../services/storageService';

const AppContext = createContext(null);

function readState() {
  return loadAppState();
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => readState());
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  const refresh = useCallback(() => {
    setState(readState());
  }, []);

  const run = useCallback(
    (operation) => {
      const result = operation();
      refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    const sync = () => refresh();
    window.addEventListener('temposemovimentos:state-changed', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('temposemovimentos:state-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [refresh]);

  useEffect(() => {
    const handleInstall = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  const actions = useMemo(
    () => ({
      loginOperator: (session) => run(() => saveSession(session)),
      logout: () => run(() => clearSession()),
      authenticateOperator: (operatorId, password) => authenticateOperatorUser(operatorId, password),
      saveOperator: (operator) => run(() => saveOperator(operator)),
      updateOperator: (id, patch) => run(() => updateOperator(id, patch)),
      deleteOperator: (id) => run(() => deleteOperator(id)),
      saveEquipment: (equipment) => run(() => saveEquipment(equipment)),
      updateEquipment: (id, patch) => run(() => updateEquipment(id, patch)),
      deleteEquipment: (id) => run(() => deleteEquipment(id)),
      saveActivityType: (activityType) => run(() => saveActivityType(activityType)),
      updateActivityType: (id, patch) => run(() => updateActivityType(id, patch)),
      deleteActivityType: (id) => run(() => deleteActivityType(id)),
      saveShift: (shift) => run(() => saveShift(shift)),
      updateShift: (id, patch) => run(() => updateShift(id, patch)),
      deleteShift: (id) => run(() => deleteShift(id)),
      startMovementRecord: (payload) => run(() => createMovementRecord(payload)),
      closeMovementRecord: (id, payload) => run(() => closeMovementRecord(id, payload)),
      saveRecord: (record) => run(() => saveRecord(record)),
      updateRecord: (id, patch) => run(() => updateRecord(id, patch)),
      deleteRecord: (id) => run(() => deleteRecord(id)),
      importData: (payload) => run(() => importData(payload)),
      exportData: () => exportData(),
      resetDatabase: () => run(() => resetDatabase()),
      updateSettings: (patch) => run(() => updateSettings(patch)),
      requestPersistentStorage: async () => {
        const result = await requestPersistentStorage();
        refresh();
        return result;
      },
      installApp: async () => {
        if (!installPromptEvent) {
          return false;
        }

        installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        setInstallPromptEvent(null);
        return choice.outcome === 'accepted';
      },
    }),
    [installPromptEvent, run],
  );

  const value = useMemo(
    () => ({
      ...state,
      records: state.movementRecords,
      ...actions,
      refresh,
      canInstallApp: Boolean(installPromptEvent),
      isLocalMode: state.settings?.storageMode !== 'ONLINE',
    }),
    [actions, installPromptEvent, refresh, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }

  return context;
}

export function useAppSelectors() {
  const state = useApp();

  return {
    operators: state.operators,
    equipments: state.equipments,
    activityTypes: state.activityTypes,
    shifts: state.shifts,
    records: state.movementRecords,
    session: state.session,
    settings: state.settings,
  };
}

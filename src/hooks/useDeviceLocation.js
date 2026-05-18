import { useEffect, useState } from 'react';
import { normalizeGpsSnapshot } from '../services/locationService';

export function useDeviceLocation() {
  const [state, setState] = useState(() => ({
    supported: typeof navigator !== 'undefined' && Boolean(navigator.geolocation),
    status: 'idle',
    location: null,
    error: '',
  }));

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((current) => ({ ...current, supported: false, status: 'unsupported' }));
      return undefined;
    }

    let active = true;

    const handleSuccess = (position) => {
      if (!active) {
        return;
      }

      const nextLocation = normalizeGpsSnapshot({
        coords: position.coords,
        timestamp: position.timestamp,
        source: 'browser-geolocation',
      });

      setState((current) => ({
        ...current,
        supported: true,
        status: nextLocation ? 'ready' : 'unavailable',
        location: nextLocation,
        error: '',
      }));
    };

    const handleError = (error) => {
      if (!active) {
        return;
      }

      setState((current) => ({
        ...current,
        supported: true,
        status: Number(error?.code) === 1 ? 'denied' : 'error',
        error: error?.message || '',
      }));
    };

    setState((current) => ({ ...current, supported: true, status: 'requesting' }));

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 12000,
    });

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 20000,
    });

    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { BASE_PRICE } from './mockData';

export type BookingStatus =
  | 'idle'
  | 'creating'
  | 'created'
  | 'accepting'
  | 'confirmed'
  | 'starting'
  | 'in_progress'
  | 'completing'
  | 'completed'
  | 'error';

type State = {
  petName: string;
  breed: string;
  petPhotoUri: string | null;
  walkerPhotoUri: string | null;
  size: string;
  temperament: string[];
  vaccines: string[];
  discoverView: 'lista' | 'mapa';
  days: string[];
  time: string;
  tip: number;
  payment: string;
  // Session against the real pawmates-backend — no login screen exists
  // yet, so this is created lazily on first use (see ensureSession) and
  // kept only in memory for this app run (see src/api/client.ts).
  accountId: string | null;
  token: string | null;
  bookingId: string | null;
  bookingStatus: BookingStatus;
  bookingError: string | null;
};

type Ctx = State & {
  setPetPhotoUri: (v: string | null) => void;
  setWalkerPhotoUri: (v: string | null) => void;
  setSize: (v: string) => void;
  toggleTemperament: (v: string) => void;
  toggleVaccine: (v: string) => void;
  setDiscoverView: (v: 'lista' | 'mapa') => void;
  toggleDay: (v: string) => void;
  setTime: (v: string) => void;
  setTip: (v: number) => void;
  setPayment: (v: string) => void;
  tipAmount: number;
  total: number;
  /** Reserva un paseo inmediato en el backend real y guarda su id. */
  createBooking: (durationMinutes: number) => Promise<void>;
  /** El paseador (simulado) acepta y se autoriza el pago. */
  acceptBooking: () => Promise<void>;
  /** Arranca el paseo en vivo. */
  startTrip: () => Promise<void>;
  /** Termina el paseo en vivo. */
  completeTrip: () => Promise<void>;
};

const AppStateContext = createContext<Ctx | null>(null);

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    petName: 'Rocky',
    breed: 'Labrador retriever',
    petPhotoUri: null,
    walkerPhotoUri: null,
    size: 'Mediano',
    temperament: ['Juguetón', 'Sociable'],
    vaccines: ['Rabia', 'Parvovirus'],
    discoverView: 'lista',
    days: ['Lun', 'Mié', 'Vie'],
    time: '8:00 am',
    tip: 15,
    payment: 'Tarjeta •• 4482',
    accountId: null,
    token: null,
    bookingId: null,
    bookingStatus: 'idle',
    bookingError: null,
  });

  // Async actions below await network calls between setState calls, so the
  // `state` closure they started with can go stale mid-flight — this ref
  // stays current across those awaits without forcing every action to be
  // one giant nested setState updater.
  const stateRef = useRef(state);
  stateRef.current = state;

  const ensureSession = useCallback(async (): Promise<{ accountId: string; token: string }> => {
    if (stateRef.current.token && stateRef.current.accountId) {
      return { accountId: stateRef.current.accountId, token: stateRef.current.token };
    }
    const session = await api.devLogin(undefined, 'owner');
    setState((s) => ({ ...s, accountId: session.accountId, token: session.token }));
    return session;
  }, []);

  const createBooking = useCallback(async (durationMinutes: number) => {
    setState((s) => ({ ...s, bookingStatus: 'creating', bookingError: null }));
    try {
      const { token } = await ensureSession();
      const booking = await api.createBooking(token, durationMinutes);
      setState((s) => ({ ...s, bookingId: booking.id, bookingStatus: 'created' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        bookingStatus: 'error',
        bookingError: err instanceof Error ? err.message : 'No se pudo reservar el paseo.',
      }));
      throw err;
    }
  }, [ensureSession]);

  const acceptBooking = useCallback(async () => {
    const { token } = stateRef.current;
    const bookingId = stateRef.current.bookingId;
    if (!token || !bookingId) return;
    setState((s) => ({ ...s, bookingStatus: 'accepting', bookingError: null }));
    try {
      await api.acceptBooking(token, bookingId);
      setState((s) => ({ ...s, bookingStatus: 'confirmed' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        bookingStatus: 'error',
        bookingError: err instanceof Error ? err.message : 'No se pudo confirmar el pago.',
      }));
      throw err;
    }
  }, []);

  const startTrip = useCallback(async () => {
    const bookingId = stateRef.current.bookingId;
    if (!bookingId) return;
    setState((s) => ({ ...s, bookingStatus: 'starting', bookingError: null }));
    try {
      await api.startTrip(bookingId);
      setState((s) => ({ ...s, bookingStatus: 'in_progress' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        bookingStatus: 'error',
        bookingError: err instanceof Error ? err.message : 'No se pudo iniciar el paseo.',
      }));
      throw err;
    }
  }, []);

  const completeTrip = useCallback(async () => {
    const bookingId = stateRef.current.bookingId;
    if (!bookingId) return;
    setState((s) => ({ ...s, bookingStatus: 'completing', bookingError: null }));
    try {
      await api.completeTrip(bookingId);
      setState((s) => ({ ...s, bookingStatus: 'completed' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        bookingStatus: 'error',
        bookingError: err instanceof Error ? err.message : 'No se pudo terminar el paseo.',
      }));
      throw err;
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const tipAmount = BASE_PRICE * (state.tip / 100);
    const total = BASE_PRICE + tipAmount;
    return {
      ...state,
      setPetPhotoUri: (v) => setState((s) => ({ ...s, petPhotoUri: v })),
      setWalkerPhotoUri: (v) => setState((s) => ({ ...s, walkerPhotoUri: v })),
      setSize: (v) => setState((s) => ({ ...s, size: v })),
      toggleTemperament: (v) => setState((s) => ({ ...s, temperament: toggleIn(s.temperament, v) })),
      toggleVaccine: (v) => setState((s) => ({ ...s, vaccines: toggleIn(s.vaccines, v) })),
      setDiscoverView: (v) => setState((s) => ({ ...s, discoverView: v })),
      toggleDay: (v) => setState((s) => ({ ...s, days: toggleIn(s.days, v) })),
      setTime: (v) => setState((s) => ({ ...s, time: v })),
      setTip: (v) => setState((s) => ({ ...s, tip: v })),
      setPayment: (v) => setState((s) => ({ ...s, payment: v })),
      createBooking,
      acceptBooking,
      startTrip,
      completeTrip,
      tipAmount,
      total,
    };
  }, [state, createBooking, acceptBooking, startTrip, completeTrip]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

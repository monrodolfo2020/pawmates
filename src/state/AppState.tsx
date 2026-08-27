import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, AuthResult, MeResult, Pet, Role } from '../api/client';
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

export type AuthStatus = 'checking' | 'guest' | 'authed';

const SESSION_KEY = 'pawmates.session';

type State = {
  // Editable draft used by OnboardingScreen before a Pet actually exists.
  petName: string;
  breed: string;
  petPhotoUri: string | null;
  petPhotoBase64: string | null;
  walkerPhotoUri: string | null;
  size: string;
  temperament: string[];
  vaccines: string[];
  discoverView: 'lista' | 'mapa';
  days: string[];
  time: string;
  tip: number;
  payment: string;
  // Real session against pawmates-backend's Identity Bounded Context.
  authStatus: AuthStatus;
  accountId: string | null;
  token: string | null;
  email: string | null;
  name: string | null;
  roles: Role[];
  authError: string | null;
  pets: Pet[];
  petsLoading: boolean;
  /** True once the first /v1/pets fetch after login/signup has resolved —
   * lets RootNavigator wait for the real answer instead of picking
   * Onboarding just because `pets` still holds its empty initial value. */
  petsChecked: boolean;
  bookingId: string | null;
  bookingStatus: BookingStatus;
  bookingError: string | null;
};

type Ctx = State & {
  setPetPhoto: (v: { uri: string; base64: string | null } | null) => void;
  setWalkerPhotoUri: (v: string | null) => void;
  setPetName: (v: string) => void;
  setBreed: (v: string) => void;
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
  signup: (params: {
    email: string;
    password: string;
    role: 'owner' | 'provider';
    name?: string;
    facePhoto?: string;
    idDocumentPhoto?: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addRole: (params: { role: 'owner' | 'provider'; facePhoto?: string; idDocumentPhoto?: string }) => Promise<void>;
  /** Crea (o actualiza la primera) mascota del dueño con los campos del formulario. */
  savePet: () => Promise<void>;
  createBooking: (durationMinutes: number) => Promise<void>;
  acceptBooking: () => Promise<void>;
  startTrip: () => Promise<void>;
  completeTrip: () => Promise<void>;
};

const AppStateContext = createContext<Ctx | null>(null);

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    petName: '',
    breed: '',
    petPhotoUri: null,
    petPhotoBase64: null,
    walkerPhotoUri: null,
    size: 'Mediano',
    temperament: [],
    vaccines: [],
    discoverView: 'lista',
    days: ['Lun', 'Mié', 'Vie'],
    time: '8:00 am',
    tip: 15,
    payment: 'Tarjeta •• 4482',
    authStatus: 'checking',
    accountId: null,
    token: null,
    email: null,
    name: null,
    roles: [],
    authError: null,
    pets: [],
    petsLoading: false,
    petsChecked: false,
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

  const loadPets = useCallback(async (token: string) => {
    setState((s) => ({ ...s, petsLoading: true }));
    try {
      const pets = await api.listPets(token);
      setState((s) => ({
        ...s,
        pets,
        petsLoading: false,
        petsChecked: true,
        petName: pets[0]?.name ?? s.petName,
        breed: pets[0]?.breed ?? s.breed,
        size: pets[0]?.size ?? s.size,
        temperament: pets[0]?.temperament ?? s.temperament,
        vaccines: pets[0]?.vaccines ?? s.vaccines,
        petPhotoUri: pets[0]?.photo ?? s.petPhotoUri,
      }));
    } catch {
      setState((s) => ({ ...s, petsLoading: false, petsChecked: true }));
    }
  }, []);

  const applyAuth = useCallback(
    async (session: { accountId: string; token: string; roles: Role[] }, me?: Pick<MeResult, 'email' | 'name'>) => {
      setState((s) => ({
        ...s,
        authStatus: 'authed',
        accountId: session.accountId,
        token: session.token,
        roles: session.roles,
        email: me?.email ?? s.email,
        name: me?.name ?? s.name,
        authError: null,
      }));
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ accountId: session.accountId, token: session.token }),
      );
      if (session.roles.includes('owner')) void loadPets(session.token);
    },
    [loadPets],
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { accountId: string; token: string };
          const me = await api.me(saved.token);
          await applyAuth({ accountId: me.id, token: saved.token, roles: me.roles }, me);
          return;
        }
      } catch {
        // Falls through to 'guest' below — an expired/invalid token just
        // means signing in again, not a fatal error.
      }
      setState((s) => ({ ...s, authStatus: 'guest' }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = useCallback(
    async (params: {
      email: string;
      password: string;
      role: 'owner' | 'provider';
      name?: string;
      facePhoto?: string;
      idDocumentPhoto?: string;
    }) => {
      setState((s) => ({ ...s, authError: null }));
      try {
        const result: AuthResult = await api.signup(params);
        await applyAuth(result);
        setState((s) => ({ ...s, email: params.email.toLowerCase(), name: params.name ?? s.name }));
      } catch (err) {
        setState((s) => ({
          ...s,
          authError: err instanceof Error ? err.message : 'No se pudo crear la cuenta.',
        }));
        throw err;
      }
    },
    [applyAuth],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, authError: null }));
      try {
        const result: AuthResult = await api.login(email, password);
        const me = await api.me(result.token);
        await applyAuth(result, me);
      } catch (err) {
        setState((s) => ({
          ...s,
          authError: err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
        }));
        throw err;
      }
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setState((s) => ({
      ...s,
      authStatus: 'guest',
      accountId: null,
      token: null,
      email: null,
      name: null,
      roles: [],
      pets: [],
      petsChecked: false,
      bookingId: null,
      bookingStatus: 'idle',
    }));
  }, []);

  const addRole = useCallback(
    async (params: { role: 'owner' | 'provider'; facePhoto?: string; idDocumentPhoto?: string }) => {
      const token = stateRef.current.token;
      if (!token) return;
      setState((s) => ({ ...s, authError: null }));
      try {
        const result = await api.addRole(token, params);
        setState((s) => ({ ...s, roles: result.roles }));
        if (result.roles.includes('owner')) void loadPets(token);
      } catch (err) {
        setState((s) => ({
          ...s,
          authError: err instanceof Error ? err.message : 'No se pudo agregar el rol.',
        }));
        throw err;
      }
    },
    [loadPets],
  );

  const savePet = useCallback(async () => {
    const { token, pets, petName, breed, size, temperament, vaccines, petPhotoBase64 } = stateRef.current;
    if (!token) return;
    const existing = pets[0];
    const photo = petPhotoBase64 ?? existing?.photo ?? null;
    const saved = existing
      ? await api.updatePet(token, existing.id, { name: petName, breed, size, temperament, vaccines, photo })
      : await api.createPet(token, { name: petName, breed, size, temperament, vaccines, photo });
    setState((s) => ({
      ...s,
      pets: existing ? s.pets.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.pets],
      petPhotoBase64: null,
    }));
  }, []);

  const createBooking = useCallback(async (durationMinutes: number) => {
    setState((s) => ({ ...s, bookingStatus: 'creating', bookingError: null }));
    try {
      const { token, pets } = stateRef.current;
      const petId = pets[0]?.id;
      if (!token || !petId) {
        throw new Error('Agrega primero los datos de tu mascota.');
      }
      const booking = await api.createBooking(token, petId, durationMinutes);
      setState((s) => ({ ...s, bookingId: booking.id, bookingStatus: 'created' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        bookingStatus: 'error',
        bookingError: err instanceof Error ? err.message : 'No se pudo reservar el paseo.',
      }));
      throw err;
    }
  }, []);

  const acceptBooking = useCallback(async () => {
    const { token, bookingId } = stateRef.current;
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
      setPetPhoto: (v) =>
        setState((s) => ({ ...s, petPhotoUri: v?.uri ?? null, petPhotoBase64: v?.base64 ?? s.petPhotoBase64 })),
      setWalkerPhotoUri: (v) => setState((s) => ({ ...s, walkerPhotoUri: v })),
      setPetName: (v) => setState((s) => ({ ...s, petName: v })),
      setBreed: (v) => setState((s) => ({ ...s, breed: v })),
      setSize: (v) => setState((s) => ({ ...s, size: v })),
      toggleTemperament: (v) => setState((s) => ({ ...s, temperament: toggleIn(s.temperament, v) })),
      toggleVaccine: (v) => setState((s) => ({ ...s, vaccines: toggleIn(s.vaccines, v) })),
      setDiscoverView: (v) => setState((s) => ({ ...s, discoverView: v })),
      toggleDay: (v) => setState((s) => ({ ...s, days: toggleIn(s.days, v) })),
      setTime: (v) => setState((s) => ({ ...s, time: v })),
      setTip: (v) => setState((s) => ({ ...s, tip: v })),
      setPayment: (v) => setState((s) => ({ ...s, payment: v })),
      signup,
      login,
      logout,
      addRole,
      savePet,
      createBooking,
      acceptBooking,
      startTrip,
      completeTrip,
      tipAmount,
      total,
    };
  }, [state, signup, login, logout, addRole, savePet, createBooking, acceptBooking, startTrip, completeTrip]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

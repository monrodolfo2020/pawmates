import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  setAccountDisabledHandler,
  AcceptedLegal,
  AuthResult,
  ChatMessage,
  MeResult,
  Pet,
  Role,
  LegalDocumentType,
  ServiceCategory,
} from '../api/client';

/** Where sending the owner's walk request stands (the walk itself is
 * followed on LiveWalkScreen, per booking). */
export type BookingStatus = 'idle' | 'creating' | 'created' | 'error';

export type AuthStatus = 'checking' | 'guest' | 'authed';

const SESSION_KEY = 'pawmates.session';

type State = {
  // Editable draft used by OnboardingScreen before a Pet actually exists.
  petName: string;
  breed: string;
  petPhotoUri: string | null;
  petPhotoBase64: string | null;
  size: string;
  temperament: string[];
  vaccines: string[];
  discoverView: 'lista' | 'mapa';
  // Real session against pawmates-backend's Identity Bounded Context.
  authStatus: AuthStatus;
  accountId: string | null;
  token: string | null;
  email: string | null;
  name: string | null;
  roles: Role[];
  emailVerified: boolean;
  authError: string | null;
  pets: Pet[];
  /** id of the Pet the draft fields above (petName, breed, ...) currently
   * represent — null means "a new pet, not saved yet". Set by
   * loadPetDraft(), read by savePet() to decide create vs update. */
  editingPetId: string | null;
  petsLoading: boolean;
  /** True once the first /v1/pets fetch after login/signup has resolved —
   * lets RootNavigator wait for the real answer instead of picking
   * Onboarding just because `pets` still holds its empty initial value. */
  petsChecked: boolean;
  pendingLegal: LegalDocumentType[];
  bookingId: string | null;
  bookingStatus: BookingStatus;
  bookingError: string | null;
  messages: ChatMessage[];
};

type Ctx = State & {
  setPetPhoto: (v: { uri: string; base64: string | null } | null) => void;
  setPetName: (v: string) => void;
  setBreed: (v: string) => void;
  setSize: (v: string) => void;
  toggleTemperament: (v: string) => void;
  toggleVaccine: (v: string) => void;
  setDiscoverView: (v: 'lista' | 'mapa') => void;
  signup: (params: {
    email: string;
    password: string;
    role: 'owner' | 'provider';
    name?: string;
    category?: ServiceCategory;
    businessName?: string;
    facePhoto?: string;
    idDocumentPhoto?: string;
    profilePhoto?: string;
    acceptedLegal: AcceptedLegal[];
  }) => Promise<void>;
  /** Documents this account owes an acceptance for — accounts created
   * before the app asked, and version bumps since. Empty while it's
   * still being checked and whenever the check fails, so a network
   * problem can't lock anyone out of the app. */
  pendingLegal: LegalDocumentType[];
  refreshPendingLegal: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addRole: (params: {
    role: 'owner' | 'provider';
    category?: ServiceCategory;
    businessName?: string;
    facePhoto?: string;
    idDocumentPhoto?: string;
    profilePhoto?: string;
    acceptedLegal: AcceptedLegal[];
  }) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  /** Seeds the pet-form draft fields — pass a Pet to edit it, or null to
   * start a new one. Always call before navigating to the pet form. */
  loadPetDraft: (pet: Pet | null) => void;
  /** Creates a new pet, or updates the one loadPetDraft() last pointed
   * at (editingPetId) — see that field's comment. */
  savePet: () => Promise<void>;
  /** Sends the request to the business. petId defaults to the owner's
   * first pet when omitted (a single-pet owner never sees the picker). */
  createBooking: (params: {
    providerServiceId: string;
    durationMinutes: number;
    scheduledAt: string;
    petId?: string;
  }) => Promise<void>;
  sendChatMessage: (bookingId: string, text: string) => Promise<void>;
  refreshMessages: (bookingId: string) => Promise<void>;
};

const AppStateContext = createContext<Ctx | null>(null);

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

// Also used to wipe the slate on logout — without this, a booking/pet
// draft typed by one account (name, breed, photo, ...)
// stayed in memory and showed up as if it belonged to the next account
// signed into in the same browser tab.
const initialState: State = {
  petName: '',
  breed: '',
  petPhotoUri: null,
  petPhotoBase64: null,
  size: 'Mediano',
  temperament: [],
  vaccines: [],
  discoverView: 'lista',
  authStatus: 'checking',
  accountId: null,
  token: null,
  email: null,
  name: null,
  roles: [],
  emailVerified: false,
  authError: null,
  pets: [],
  editingPetId: null,
  petsLoading: false,
  petsChecked: false,
  pendingLegal: [],
  bookingId: null,
  bookingStatus: 'idle',
  bookingError: null,
  messages: [],
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);

  // Async actions below await network calls between setState calls, so the
  // `state` closure they started with can go stale mid-flight — this ref
  // stays current across those awaits without forcing every action to be
  // one giant nested setState updater.
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadPendingLegal = useCallback(async (token: string) => {
    try {
      const { pending } = await api.getMyLegalAcceptances(token);
      setState((s) => ({ ...s, pendingLegal: pending }));
    } catch {
      // Treated as "nothing pending". Blocking the whole app because a
      // status check failed would be a worse outcome than a late
      // acceptance, and the next load asks again.
      setState((s) => ({ ...s, pendingLegal: [] }));
    }
  }, []);

  const loadPets = useCallback(async (token: string) => {
    setState((s) => ({ ...s, petsLoading: true }));
    try {
      const pets = await api.listPets(token);
      setState((s) => ({ ...s, pets, petsLoading: false, petsChecked: true }));
    } catch {
      setState((s) => ({ ...s, petsLoading: false, petsChecked: true }));
    }
  }, []);

  const applyAuth = useCallback(
    async (
      session: { accountId: string; token: string; roles: Role[] },
      me?: Pick<MeResult, 'email' | 'name' | 'emailVerified'>,
    ) => {
      setState((s) => ({
        ...s,
        authStatus: 'authed',
        accountId: session.accountId,
        token: session.token,
        roles: session.roles,
        email: me?.email ?? s.email,
        name: me?.name ?? s.name,
        emailVerified: me?.emailVerified ?? s.emailVerified,
        authError: null,
      }));
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ accountId: session.accountId, token: session.token }),
      );
      if (session.roles.includes('owner')) void loadPets(session.token);
      void loadPendingLegal(session.token);
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

  const refreshPendingLegal = useCallback(async () => {
    const token = stateRef.current.token;
    if (token) await loadPendingLegal(token);
  }, [loadPendingLegal]);

  const signup = useCallback(
    async (params: {
      email: string;
      password: string;
      role: 'owner' | 'provider';
      name?: string;
      category?: ServiceCategory;
      businessName?: string;
      facePhoto?: string;
      idDocumentPhoto?: string;
      profilePhoto?: string;
      acceptedLegal: AcceptedLegal[];
    }) => {
      setState((s) => ({ ...s, authError: null }));
      try {
        const result: AuthResult = await api.signup(params);
        await applyAuth(result);
        // A brand-new account is never verified yet — applyAuth's `me`
        // param is omitted here (signup's response doesn't include it),
        // so set this explicitly rather than carrying over a stale
        // leftover value from whatever the state held before.
        setState((s) => ({
          ...s,
          email: params.email.toLowerCase(),
          name: params.name ?? s.name,
          emailVerified: false,
        }));
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
    setState({ ...initialState, authStatus: 'guest' });
  }, []);

  // A suspension can arrive on any request, mid-session. Rather than let
  // every screen fail on its own, sign out once and say why — the login
  // screen already shows authError.
  useEffect(() => {
    setAccountDisabledHandler((message) => {
      void AsyncStorage.removeItem(SESSION_KEY);
      setState({ ...initialState, authStatus: 'guest', authError: message });
    });
    return () => setAccountDisabledHandler(null);
  }, []);

  const addRole = useCallback(
    async (params: {
      role: 'owner' | 'provider';
      category?: ServiceCategory;
      businessName?: string;
      facePhoto?: string;
      idDocumentPhoto?: string;
      profilePhoto?: string;
      acceptedLegal: AcceptedLegal[];
    }) => {
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

  const sendVerificationEmail = useCallback(async () => {
    const token = stateRef.current.token;
    if (!token) return;
    await api.sendVerificationEmail(token);
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    const token = stateRef.current.token;
    if (!token) return;
    await api.verifyEmail(token, code);
    setState((s) => ({ ...s, emailVerified: true }));
  }, []);

  /** Seeds the draft fields from a specific pet (editing it) or resets
   * them to blank (`pet: null` — starting a new one). Always call this
   * before showing the pet form; savePet() below trusts editingPetId
   * completely, it doesn't re-derive "which pet" from anything else. */
  const loadPetDraft = useCallback((pet: Pet | null) => {
    setState((s) => ({
      ...s,
      editingPetId: pet?.id ?? null,
      petName: pet?.name ?? '',
      breed: pet?.breed ?? '',
      size: pet?.size ?? 'Mediano',
      temperament: pet?.temperament ?? [],
      vaccines: pet?.vaccines ?? [],
      petPhotoUri: pet?.photo ?? null,
      petPhotoBase64: null,
    }));
  }, []);

  const savePet = useCallback(async () => {
    const { token, pets, editingPetId, petName, breed, size, temperament, vaccines, petPhotoBase64 } =
      stateRef.current;
    if (!token) return;
    const existing = editingPetId ? pets.find((p) => p.id === editingPetId) : undefined;
    const photo = petPhotoBase64 ?? existing?.photo ?? null;
    const saved = existing
      ? await api.updatePet(token, existing.id, { name: petName, breed, size, temperament, vaccines, photo })
      : await api.createPet(token, { name: petName, breed, size, temperament, vaccines, photo });
    setState((s) => ({
      ...s,
      pets: existing ? s.pets.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.pets],
      editingPetId: saved.id,
      petPhotoBase64: null,
    }));
  }, []);

  const createBooking = useCallback<Ctx['createBooking']>(async ({ providerServiceId, durationMinutes, scheduledAt, petId }) => {
    setState((s) => ({ ...s, bookingStatus: 'creating', bookingError: null }));
    try {
      const { token, pets } = stateRef.current;
      const resolvedPetId = petId ?? pets[0]?.id;
      if (!token || !resolvedPetId) {
        throw new Error('Agrega primero los datos de tu mascota.');
      }
      const booking = await api.createBooking(token, resolvedPetId, providerServiceId, durationMinutes, scheduledAt);
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

  const refreshMessages = useCallback(async (bookingId: string) => {
    const { token } = stateRef.current;
    if (!token) return;
    try {
      const messages = await api.listMessages(token, bookingId);
      setState((s) => ({ ...s, messages }));
    } catch {
      // Silent — polled on a timer; one missed tick isn't worth a banner.
    }
  }, []);

  const sendChatMessage = useCallback(
    async (bookingId: string, text: string) => {
      const { token } = stateRef.current;
      if (!token || !text.trim()) return;
      await api.sendMessage(token, bookingId, text.trim());
      await refreshMessages(bookingId);
    },
    [refreshMessages],
  );

  const value = useMemo<Ctx>(() => {
    return {
      ...state,
      setPetPhoto: (v) =>
        setState((s) => ({ ...s, petPhotoUri: v?.uri ?? null, petPhotoBase64: v?.base64 ?? s.petPhotoBase64 })),
      setPetName: (v) => setState((s) => ({ ...s, petName: v })),
      setBreed: (v) => setState((s) => ({ ...s, breed: v })),
      setSize: (v) => setState((s) => ({ ...s, size: v })),
      toggleTemperament: (v) => setState((s) => ({ ...s, temperament: toggleIn(s.temperament, v) })),
      toggleVaccine: (v) => setState((s) => ({ ...s, vaccines: toggleIn(s.vaccines, v) })),
      setDiscoverView: (v) => setState((s) => ({ ...s, discoverView: v })),
      pendingLegal: state.pendingLegal,
      refreshPendingLegal,
      signup,
      login,
      logout,
      addRole,
      sendVerificationEmail,
      verifyEmail,
      loadPetDraft,
      savePet,
      createBooking,
      sendChatMessage,
      refreshMessages,
    };
  }, [
    state,
    refreshPendingLegal,
    signup,
    login,
    logout,
    addRole,
    sendVerificationEmail,
    verifyEmail,
    loadPetDraft,
    savePet,
    createBooking,
    sendChatMessage,
    refreshMessages,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

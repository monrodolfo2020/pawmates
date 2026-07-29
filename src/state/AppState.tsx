import React, { createContext, useContext, useMemo, useState } from 'react';
import { BASE_PRICE } from './mockData';

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
  });

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
      tipAmount,
      total,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

import type { MyProviderProfile } from '../../api/client';
import { listInSpanish, missingToPublish } from '../pageStatus';

const profile = (overrides: Partial<MyProviderProfile>) =>
  ({
    businessName: 'Paseos Pedro',
    bio: 'Paseos con cariño',
    category: 'walker',
    price: { amount: 15000, currency: 'MXN' },
    ...overrides,
  }) as MyProviderProfile;

describe('missingToPublish', () => {
  it('asks for nothing once a walker has name, description and rate', () => {
    expect(missingToPublish(profile({}))).toEqual([]);
  });

  it('asks a walker for the rate', () => {
    expect(missingToPublish(profile({ price: null }))).toEqual(['la tarifa por paseo']);
  });

  it('never asks a vet for a rate', () => {
    expect(missingToPublish(profile({ category: 'vet', price: null }))).toEqual([]);
  });

  it('lists everything that is missing', () => {
    expect(missingToPublish(profile({ businessName: null, bio: null, price: null }))).toEqual([
      'el nombre del negocio',
      'la descripción',
      'la tarifa por paseo',
    ]);
  });
});

describe('listInSpanish', () => {
  it('joins with commas and "y" before the last item', () => {
    expect(listInSpanish([])).toBe('');
    expect(listInSpanish(['a'])).toBe('a');
    expect(listInSpanish(['a', 'b'])).toBe('a y b');
    expect(listInSpanish(['a', 'b', 'c'])).toBe('a, b y c');
  });
});

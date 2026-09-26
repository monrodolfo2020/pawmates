import { draftsToServices, formatDuration, lowestPrice, pesos, toDraft } from '../services';

const draft = (over: Partial<{ name: string; detail: string; price: string; minutes: string }> = {}) => ({
  id: 'svc0001', name: 'Paseo', detail: '', price: '', minutes: '', ...over,
});

describe('services helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('formats prices in pesos', () => {
    expect(pesos(15000)).toBe('$150');
    expect(pesos(15050)).toBe('$150.5');
  });

  it('finds the lowest price, ignoring services without one', () => {
    expect(lowestPrice([])).toBeNull();
    expect(
      lowestPrice([
        { id: 'a', name: 'A', detail: '', price: 30000, durationMinutes: null },
        { id: 'b', name: 'B', detail: '', price: null, durationMinutes: null },
        { id: 'c', name: 'C', detail: '', price: 18000, durationMinutes: null },
      ]),
    ).toBe(18000);
  });

  it('turns drafts into services, dropping empty rows', () => {
    const result = draftsToServices([
      draft({ name: ' Paseo largo ', price: '$1,250', minutes: '90' }),
      draft({ name: '', detail: '' }),
    ]);
    expect(result).toEqual({
      services: [{ id: 'svc0001', name: 'Paseo largo', detail: '', price: 125000, durationMinutes: 90 }],
    });
  });

  it('keeps price and duration optional', () => {
    expect(draftsToServices([draft()])).toEqual({
      services: [{ id: 'svc0001', name: 'Paseo', detail: '', price: null, durationMinutes: null }],
    });
  });

  it('names the first problem to fix', () => {
    expect(draftsToServices([draft({ name: '', price: '100' })])).toEqual({ error: 'Escribe el nombre del servicio 1.' });
    expect(draftsToServices([draft({ price: 'cien' })])).toHaveProperty('error');
    expect(draftsToServices([draft({ minutes: '2' })])).toHaveProperty('error');
  });

  it('round-trips a saved service', () => {
    const service = { id: 'svc0001', name: 'Paseo', detail: 'x', price: 18050, durationMinutes: 45 };
    expect(draftsToServices([toDraft(service)])).toEqual({ services: [service] });
  });
});

import { distanceKm, formatDistance, sortByDistance } from '../distance';

const zocalo = { latitude: 19.4326, longitude: -99.1332 };
const angel = { latitude: 19.4270, longitude: -99.1677 };
const guadalajara = { latitude: 20.6597, longitude: -103.3496 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(zocalo, zocalo)).toBe(0);
  });
  it('measures across a city and between cities', () => {
    expect(distanceKm(zocalo, angel)).toBeCloseTo(3.7, 1);
    expect(distanceKm(zocalo, guadalajara)).toBeGreaterThan(450);
    expect(distanceKm(zocalo, guadalajara)).toBeLessThan(470);
  });
});

describe('formatDistance', () => {
  it('uses metres up close and rounds further out', () => {
    expect(formatDistance(0.01)).toBe('a 50 m');
    expect(formatDistance(0.34)).toBe('a 350 m');
    expect(formatDistance(2.44)).toBe('a 2.4 km');
    expect(formatDistance(18.4)).toBe('a 18 km');
  });
});

describe('sortByDistance', () => {
  it('puts the nearest first and the ones without a point last, in their original order', () => {
    const list = [
      { id: 'sin-ubicacion-1', latitude: null, longitude: null },
      { id: 'guadalajara', ...guadalajara },
      { id: 'sin-ubicacion-2' },
      { id: 'angel', ...angel },
    ];
    expect(sortByDistance(list, zocalo).map((x) => x.id)).toEqual([
      'angel',
      'guadalajara',
      'sin-ubicacion-1',
      'sin-ubicacion-2',
    ]);
  });
});

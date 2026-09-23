import { whatsappUrl } from '../contactLinks';

describe('whatsappUrl', () => {
  it('adds Mexico’s country code to a 10-digit number, however it was typed', () => {
    expect(whatsappUrl('55 1234 5678')).toBe('https://wa.me/525512345678');
    expect(whatsappUrl('(722) 123-4567')).toBe('https://wa.me/527221234567');
  });

  it('keeps a number that already has a country code', () => {
    expect(whatsappUrl('+52 55-1234-5678')).toBe('https://wa.me/525512345678');
  });

  it('refuses a number too short to be real', () => {
    expect(whatsappUrl('12345')).toBeNull();
  });

  it('prefills a greeting that names the business', () => {
    expect(whatsappUrl('5512345678', 'Paseos Pedro')).toBe(
      'https://wa.me/525512345678?text=' +
        encodeURIComponent('Hola Paseos Pedro, los encontré en PawMates.'),
    );
  });
});

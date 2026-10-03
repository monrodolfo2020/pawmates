import { categoryFromText, parseInvitations } from './parseInvitations';

describe('parseInvitations', () => {
  it('reads tab-separated rows, skipping the header and blank lines', () => {
    const text = [
      'Nombre\tCategoría\tDirección\tWhatsApp',
      'Vet Patitas\tVeterinaria\tAv. Hidalgo 10\t722 123 4567',
      '',
      'Guau Spa\tEstética canina',
    ].join('\n');
    expect(parseInvitations(text)).toEqual({
      rows: [
        { businessName: 'Vet Patitas', category: 'vet', publicAddress: 'Av. Hidalgo 10', whatsapp: '722 123 4567' },
        { businessName: 'Guau Spa', category: 'grooming' },
      ],
      errors: [],
    });
  });

  it('reports rows it cannot read instead of guessing', () => {
    const { rows, errors } = parseInvitations('Tienda X\tTienda\n\tVeterinaria');
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('Tienda X');
  });

  it('understands the usual ways of naming each category', () => {
    expect(categoryFromText('Paseador')).toBe('walker');
    expect(categoryFromText('Clínica veterinaria')).toBe('vet');
    expect(categoryFromText('Baño y corte')).toBe('grooming');
    expect(categoryFromText('Guardería')).toBe('boarding');
    expect(categoryFromText('Adiestramiento')).toBe('training');
    expect(categoryFromText('Otro')).toBe('other');
    expect(categoryFromText('')).toBeNull();
  });
});

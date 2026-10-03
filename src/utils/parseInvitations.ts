import { NewInvitation, ServiceCategory } from '../api/client';

/**
 * Reads the list an admin pastes from a spreadsheet: one business per
 * line, columns separated by tabs (what Excel and Google Sheets copy),
 * in this order:
 *
 *   Nombre · Categoría · Dirección · WhatsApp · Horario · Descripción
 *
 * Only the first two are required. A first line that is the header
 * ("Nombre…") is skipped.
 */
export const INVITATION_COLUMNS = ['Nombre', 'Categoría', 'Dirección', 'WhatsApp', 'Horario', 'Descripción'];

const fold = (v: string) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** "Veterinaria", "vet", "Estética canina", "Hotel"… → the category. */
export function categoryFromText(text: string): ServiceCategory | null {
  const t = fold(text);
  if (!t) return null;
  if (/pase|walker/.test(t)) return 'walker';
  if (/vet|clinic|hospital/.test(t)) return 'vet';
  if (/estet|groom|bano|spa|corte/.test(t)) return 'grooming';
  if (/hotel|guarder|pension|hosped/.test(t)) return 'boarding';
  if (/entren|adiestr|training/.test(t)) return 'training';
  if (/otro|other/.test(t)) return 'other';
  return null;
}

export type ParsedInvitations = {
  rows: NewInvitation[];
  errors: string[];
};

export function parseInvitations(text: string): ParsedInvitations {
  const rows: NewInvitation[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const cells = line.split('\t').map((c) => c.trim());
    if (i === 0 && fold(cells[0]) === 'nombre') return;
    const [name, categoryText, address, whatsapp, hours, bio] = cells;
    if (!name) {
      errors.push(`Renglón ${i + 1}: falta el nombre.`);
      return;
    }
    const category = categoryFromText(categoryText ?? '');
    if (!category) {
      errors.push(
        `Renglón ${i + 1} (${name}): no reconozco la categoría «${categoryText ?? ''}». Usa Paseador, Veterinaria, Estética, Hotel, Entrenamiento u Otro.`,
      );
      return;
    }
    rows.push({
      businessName: name,
      category,
      ...(address ? { publicAddress: address } : {}),
      ...(whatsapp ? { whatsapp } : {}),
      ...(hours ? { hours } : {}),
      ...(bio ? { bio } : {}),
    });
  });
  return { rows, errors };
}

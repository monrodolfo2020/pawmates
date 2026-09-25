#!/usr/bin/env node
// Checks that the lists this app shares with pawmates-backend still say
// the same thing on both sides: categories, plans, legal documents,
// booking statuses, and so on. Each repo keeps its own copy (they're
// separate projects with no shared package), and a copy that drifts
// fails quietly: a category the backend rejects, a status shown in
// English, a legal document the app can't accept.
//
//   npm run check:shared                       # backend at ../pawmates-backend,
//                                              # or read from GitHub if not there
//   node scripts/check-shared-lists.mjs --backend <dir> [--frontend <dir>]
//
// Exit code 1 when anything differs. The backend repo's CI runs this
// same script, so a change on either side is checked.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND_REPO_RAW = 'https://raw.githubusercontent.com/monrodolfo2020/pawmates-backend/main';

const FRONTEND = {
  client: 'src/api/client.ts',
  mockData: 'src/state/mockData.ts',
};
const BACKEND = {
  categories: 'apps/pawmates-api/src/providers/domain/value-objects/service-category.ts',
  plans: 'apps/pawmates-api/src/providers/domain/value-objects/business-plan.ts',
  billing: 'apps/pawmates-api/src/providers/domain/value-objects/billing.ts',
  pageDesign: 'apps/pawmates-api/src/providers/domain/value-objects/page-design.ts',
  legal: 'apps/pawmates-api/src/identity/domain/value-objects/legal-document.ts',
  booking: 'apps/pawmates-api/src/booking/domain/saga/booking-process-manager.ts',
  bookingStatus: 'apps/pawmates-api/src/booking/domain/value-objects/booking-status.ts',
  walkEvent: 'apps/pawmates-api/src/booking/domain/entities/walk-event.entity.ts',
  pet: 'apps/pawmates-api/src/identity/api/dto/pet.dto.ts',
  auth: 'apps/pawmates-api/src/identity/api/auth.service.ts',
};

// [what it is, frontend file, frontend name, backend file, backend name]
const PAIRS = [
  ['Categorías de negocio', FRONTEND.client, 'SERVICE_CATEGORIES', BACKEND.categories, 'SERVICE_CATEGORIES'],
  ['Planes', FRONTEND.client, 'BUSINESS_PLANS', BACKEND.plans, 'BUSINESS_PLANS'],
  ['Periodos de cobro', FRONTEND.client, 'BILLING_PERIODS', BACKEND.billing, 'BILLING_PERIODS'],
  ['Plantillas de página', FRONTEND.client, 'PAGE_TEMPLATES', BACKEND.pageDesign, 'PAGE_TEMPLATES'],
  ['Tipografías de página', FRONTEND.client, 'PAGE_FONTS', BACKEND.pageDesign, 'PAGE_FONTS'],
  ['Tamaños de texto de página', FRONTEND.client, 'PAGE_TEXT_SIZES', BACKEND.pageDesign, 'PAGE_TEXT_SIZES'],
  ['Secciones de página', FRONTEND.client, 'PAGE_SECTIONS', BACKEND.pageDesign, 'PAGE_SECTIONS'],
  ['Bloques de página', FRONTEND.client, 'PAGE_BLOCK_TYPES', BACKEND.pageDesign, 'PAGE_BLOCK_TYPES'],
  ['Documentos legales', FRONTEND.client, 'LEGAL_DOCUMENTS', BACKEND.legal, 'LEGAL_DOCUMENTS'],
  ['Código de Meet & Greet', FRONTEND.client, 'MEET_GREET_SERVICE_TYPE_CODE', BACKEND.booking, 'MEET_GREET_SERVICE_TYPE_CODE'],
  ['Estados de reserva', FRONTEND.client, 'BOOKING_STATUSES', BACKEND.bookingStatus, 'BookingStatus'],
  ['Registros del paseo', FRONTEND.client, 'WALK_EVENT_TYPES', BACKEND.walkEvent, 'WALK_EVENT_TYPES'],
  ['Tamaños de mascota', FRONTEND.mockData, 'sizeOptions', BACKEND.pet, 'PET_SIZES'],
  ['Nombres de categoría (correo al admin)', FRONTEND.client, 'CATEGORY_LABELS_SINGULAR', BACKEND.auth, 'CATEGORY_LABELS'],
];

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const here = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(argValue('--frontend') ?? join(here, '..'));
const backendArg = argValue('--backend') ?? process.env.PAWMATES_BACKEND_DIR;
const backendDir = backendArg
  ? resolve(backendArg)
  : existsSync(join(frontendDir, '../pawmates-backend/package.json'))
    ? resolve(frontendDir, '../pawmates-backend')
    : null;

async function readBackend(path) {
  if (backendDir) return readFileSync(join(backendDir, path), 'utf8');
  const res = await fetch(`${BACKEND_REPO_RAW}/${path}`);
  if (!res.ok) throw new Error(`No se pudo leer ${path} del backend en GitHub (${res.status}).`);
  return res.text();
}

/** The value assigned to `name` in a TypeScript source: an array, object
 * or string literal, or the string values of an enum. Our own files,
 * read as data — only literals are evaluated, never the module. */
function extract(source, name, where) {
  const asEnum = new RegExp(`enum\\s+${name}\\s*\\{([^}]*)\\}`).exec(source);
  if (asEnum) return [...asEnum[1].matchAll(/=\s*'([^']*)'/g)].map((m) => m[1]);

  const decl = new RegExp(`(?:const|let)\\s+${name}\\b[^=]*=\\s*`).exec(source);
  if (!decl) throw new Error(`No encontré ${name} en ${where}.`);
  const start = decl.index + decl[0].length;
  const open = source[start];

  let end;
  if (open === "'" || open === '"') {
    end = source.indexOf(open, start + 1) + 1;
  } else if (open === '[' || open === '{') {
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let quote = null;
    for (let i = start; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = null;
      } else if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === open) depth++;
      else if (c === close && --depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (!end) throw new Error(`No pude leer el valor de ${name} en ${where}.`);
  const literal = source.slice(start, end).replace(/\/\/[^\n]*/g, '');
  return new Function(`return (${literal});`)();
}

function describeDifference(front, back) {
  if (typeof front === 'string' || typeof back === 'string') {
    return front === back ? null : `app: ${JSON.stringify(front)} · backend: ${JSON.stringify(back)}`;
  }
  if (Array.isArray(front) && Array.isArray(back)) {
    const onlyFront = front.filter((v) => !back.includes(v));
    const onlyBack = back.filter((v) => !front.includes(v));
    if (!onlyFront.length && !onlyBack.length) return null;
    return [
      onlyFront.length && `solo en la app: ${onlyFront.join(', ')}`,
      onlyBack.length && `solo en el backend: ${onlyBack.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  const keys = [...new Set([...Object.keys(front), ...Object.keys(back)])];
  const diffs = keys
    .filter((k) => front[k] !== back[k])
    .map((k) => `${k}: app ${JSON.stringify(front[k])} · backend ${JSON.stringify(back[k])}`);
  return diffs.length ? diffs.join('; ') : null;
}

const cache = new Map();
const read = async (side, path) => {
  const key = `${side}:${path}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      side === 'front' ? readFileSync(join(frontendDir, path), 'utf8') : await readBackend(path),
    );
  }
  return cache.get(key);
};

let failures = 0;
console.log(`Backend: ${backendDir ?? BACKEND_REPO_RAW}\n`);
for (const [label, fFile, fName, bFile, bName] of PAIRS) {
  try {
    const front = extract(await read('front', fFile), fName, fFile);
    const back = extract(await read('back', bFile), bName, bFile);
    const diff = describeDifference(front, back);
    if (diff) {
      failures++;
      console.log(`✗ ${label}\n    ${diff}\n    ${fFile} (${fName}) ↔ ${bFile} (${bName})`);
    } else {
      console.log(`✓ ${label}`);
    }
  } catch (err) {
    failures++;
    console.log(`✗ ${label}\n    ${err.message}`);
  }
}

console.log(
  failures
    ? `\n${failures} lista(s) no coinciden entre la app y el backend.`
    : `\nLas ${PAIRS.length} listas compartidas coinciden.`,
);
process.exit(failures ? 1 : 0);

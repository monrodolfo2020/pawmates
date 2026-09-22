#!/usr/bin/env node
/**
 * Copies the legal documents from docs/legal into src/legal so the app
 * can render them offline.
 *
 * Two copies exist on purpose. The markdown in docs/legal is the version
 * a lawyer reviews and edits: it carries a draft banner, `[[PLACEHOLDER]]`
 * fields and a notes-for-your-lawyer section. The app must ship none of
 * that, so this strips the banner and everything from the notes divider
 * onwards, and writes the rest as a TypeScript string.
 *
 * Run it after editing any document:
 *     node scripts/sync-legal-text.mjs
 *
 * Then bump that document's version in the backend's legal-document.ts —
 * the version is what makes the app ask everyone to accept again, and a
 * changed text with an unchanged version means people are recorded as
 * having accepted something they never saw.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DOCUMENTS = [
  { variable: 'privacyNotice', file: 'aviso-de-privacidad.md' },
  { variable: 'ownerTerms', file: 'terminos-dueños.md' },
  { variable: 'providerAgreement', file: 'acuerdo-prestadores.md' },
];

/** Everything after the first `---` / `---` pair is editorial: the
 * notes for the lawyer, and in the privacy notice the short and
 * express-consent variants, which the app renders from its own copy. */
function operativeText(markdown) {
  const [body] = markdown.split(/\n-{3,}\n-{3,}\n/);
  return body
    .split('\n')
    .filter((line) => !/^\s*>/.test(line)) // the draft-warning blockquote
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

for (const { variable, file } of DOCUMENTS) {
  const markdown = readFileSync(join(root, 'docs/legal', file), 'utf8');
  const text = operativeText(markdown);
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  writeFileSync(
    join(root, 'src/legal', `${variable}.ts`),
    `// GENERATED from docs/legal/${file} by scripts/sync-legal-text.mjs.\n` +
      `// Do not edit here — edit the markdown and re-run the script, then bump\n` +
      `// the version in the backend's legal-document.ts.\n\n` +
      `export const ${variable} = \`${escaped}\`;\n`,
    'utf8',
  );
  console.log(`${variable}: ${text.length} chars from ${file}`);
}

import { expect, test } from '@playwright/test';
import { api, createAdmin, openAs, uniqueEmail, uniqueName } from './helpers';

// A real (tiny) PNG, since the web picker reads and resizes the file.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR42mP8z8BQz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC',
  'base64',
);

type Invitation = { id: string; token: string; businessName: string };

test('el admin pega su lista de negocios y obtiene el enlace de cada uno', async ({ page }) => {
  const admin = await createAdmin();
  const vet = uniqueName('Vet Lista');
  const spa = uniqueName('Spa Lista');
  await openAs(page, admin);
  await page.getByText('Menú', { exact: true }).click();
  await page.getByText('Admin', { exact: true }).filter({ visible: true }).click();
  await page.getByText('Invitaciones', { exact: true }).first().click();

  await page
    .getByLabel('Lista de negocios')
    .fill(
      `Nombre\tCategoría\tDirección\tWhatsApp\n${vet}\tVeterinaria\tAv. Hidalgo 10, Toluca\t722 123 4567\n${spa}\tEstética`,
    );
  await page.getByText('Crear 2 invitaciones', { exact: true }).click();
  await expect(page.getByText('Se crearon 2 invitaciones.', { exact: false })).toBeVisible();
  await expect(page.getByText(vet, { exact: true })).toBeVisible();
  await expect(page.getByText(spa, { exact: true })).toBeVisible();
  // Only the one with a WhatsApp number can be sent there directly.
  await expect(page.getByText('Enviar por WhatsApp', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible();
});

test('el negocio abre su enlace, ve su página y la reclama al registrarse', async ({ page }) => {
  const admin = await createAdmin();
  const businessName = uniqueName('Estética Invitada');
  const [invitation] = await api<Invitation[]>('POST', '/v1/admin/invitations', {
    token: admin.token,
    body: {
      invitations: [
        {
          businessName,
          category: 'grooming',
          publicAddress: 'Calle Morelos 5, Toluca',
          whatsapp: '7229876543',
          hours: 'Lunes a sábado, 9 a 19',
        },
      ],
    },
  });

  await page.goto(`/?invitacion=${invitation.token}`);
  await expect(page.getByText(`Preparamos una página gratis para ${businessName}`)).toBeVisible();
  // The preview is the page as it will look.
  await expect(page.getByText('Lunes a sábado, 9 a 19').first()).toBeVisible();
  await expect(page.getByText('Calle Morelos 5, Toluca').first()).toBeVisible();

  // Not public: it isn't in the directory.
  const directory = await api<{ name: string }[]>('GET', '/v1/providers?category=grooming');
  expect(directory.map((p) => p.name)).not.toContain(businessName);

  await page.getByText('Reclamar mi página gratis', { exact: true }).click();
  // The form starts with the business already filled in.
  await expect(page.getByPlaceholder('Ej. Veterinaria San Ángel')).toHaveValue(businessName);
  const next = page.getByText('Siguiente', { exact: true });
  await next.click();
  await page.getByPlaceholder('Tu nombre').fill('Lupita');
  await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('lupita'));
  await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
  await page.getByPlaceholder('Escríbela otra vez').fill('Password1!');
  await next.click();
  for (const label of ['Foto de tu cara', 'Foto de tu identificación']) {
    const chooser = page.waitForEvent('filechooser');
    await page.getByText(label, { exact: true }).locator('xpath=following::*[1]').click();
    await (await chooser).setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG });
  }
  await page.getByRole('checkbox').nth(0).click();
  await page.getByRole('checkbox').nth(1).click();
  await page.getByText('Crear cuenta', { exact: true }).last().click();
  await expect(page.getByText('Verifica tu correo', { exact: true })).toBeVisible();

  // The page the business now has carries what was prepared for it.
  const list = await api<{ id: string; claimedAt: string | null; claimedByEmail: string | null }[]>(
    'GET',
    '/v1/admin/invitations',
    { token: admin.token },
  );
  const claimed = list.find((i) => i.id === invitation.id)!;
  expect(claimed.claimedAt).not.toBeNull();
  expect(claimed.claimedByEmail).toContain('lupita');
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('pawmates.session') ?? '{}'));
  const mine = await api<{ whatsapp: string; hours: string; bio: string; isPublished: boolean }>(
    'GET',
    '/v1/providers/me',
    { token: session.token },
  );
  expect(mine).toMatchObject({ whatsapp: '7229876543', hours: 'Lunes a sábado, 9 a 19', isPublished: true });

  // The link now says so instead of offering the page again.
  const other = await page.context().browser()!.newPage({ baseURL: page.url() });
  await other.goto(`/?invitacion=${invitation.token}`);
  await expect(other.getByText('Esta página ya fue reclamada')).toBeVisible();
});

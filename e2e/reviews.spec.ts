import { expect, test, type Page } from '@playwright/test';
import {
  api,
  confirmedWalk,
  createBusiness,
  createOwner,
  createWalker,
  moveBookingToPast,
  openAs,
  uniqueName,
} from './helpers';

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

async function openBookings(page: Page) {
  await page.getByText('Menú', { exact: true }).click();
  await page.getByText('Reservas', { exact: true }).click();
  await expect(page.getByText('Tus reservas')).toBeVisible();
}

test('la dueña califica con huesitos un paseo que ya ocurrió y su reseña sale en la página del negocio', async ({ page }) => {
  const businessName = uniqueName('Paseos Reseña');
  const walker = await createWalker({ businessName });
  const owner = await createOwner('Lucía Pérez');
  const bookingId = await confirmedWalk(owner, walker, tomorrow());

  // Still ahead: nothing to rate yet.
  await openAs(page, owner);
  await openBookings(page);
  await expect(page.getByText(businessName).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('Calificar', { exact: true })).toHaveCount(0);

  // Once it took place, the owner rates it.
  moveBookingToPast(bookingId);
  await page.goto('/');
  await openBookings(page);
  await page.getByText('Calificar', { exact: true }).click();
  await expect(page.getByText(`¿Cómo te fue con ${businessName}?`)).toBeVisible();
  await page.getByTestId('bone-4').click();
  await expect(page.getByText('Muy bueno')).toBeVisible();
  await page.getByLabel('Tu reseña').fill('Muy puntual y cariñoso con Toby.');
  await page.getByText('Publicar reseña').click();
  await expect(page.getByText('Tu calificación')).toBeVisible();
  await expect(page.getByText('Editar reseña')).toBeVisible();

  // It shows on the business's page, with the author's first name and
  // initial only.
  await page.goto('/');
  await page.getByText(businessName).first().click();
  await expect(page.getByText('Muy puntual y cariñoso con Toby.')).toBeVisible();
  await expect(page.getByText(/Lucía P\. ·/)).toBeVisible();
  await expect(page.getByText('4.0').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('Califican los dueños que reservaron con este negocio', { exact: false })).toBeVisible();
});

test('una veterinaria se reseña desde su página, una vez por dueño, y el directorio pone arriba a la mejor calificada', async ({ page }) => {
  const suffix = uniqueName('');
  const good = await createBusiness({ businessName: `Veterinaria Buena${suffix}`, category: 'vet' });
  const newer = await createBusiness({ businessName: `Veterinaria Nueva${suffix}`, category: 'vet' });
  const owner = await createOwner('Marta');
  const other = await createOwner('Raúl');
  await api('POST', `/v1/providers/${good.accountId}/reviews`, { token: other.token, body: { rating: 5 } });

  await openAs(page, owner);
  await page.getByText(`Veterinaria Buena${suffix}`).first().click();
  await page.getByText('Escribir una reseña').click();
  await page.getByTestId('bone-5').click();
  await page.getByText('Publicar reseña').click();
  await expect(page.getByText('Editar tu reseña')).toBeVisible();
  await expect(page.getByText('(2 reseñas)').filter({ visible: true }).first()).toBeVisible();

  // Editing changes the same review instead of adding one.
  await page.getByText('Editar tu reseña').click();
  await page.getByTestId('bone-3').click();
  await page.getByText('Guardar cambios').click();
  await expect(page.getByText('4.0').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('(2 reseñas)').filter({ visible: true }).first()).toBeVisible();

  // Rated ahead of the newer one without reviews, though newest used to
  // come first.
  const vets = await api<{ accountId: string }[]>('GET', '/v1/providers?category=vet');
  const order = vets.map((v) => v.accountId);
  expect(order.indexOf(good.accountId)).toBeLessThan(order.indexOf(newer.accountId));
});

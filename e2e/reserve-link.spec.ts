import { expect, test } from '@playwright/test';
import { api, createOwner, createWalker, openAs, uniqueEmail, uniqueName } from './helpers';

// "Reservar en PawMates" on a walker's public page: whoever follows it
// ends up asking that walker for a walk, even if they had no account.

async function publicSlug(accountId: string) {
  const provider = await api<{ slug: string }>('GET', `/v1/providers/${accountId}`);
  return provider.slug;
}

test('alguien sin cuenta llega desde la página pública, se registra y vuelve al negocio para reservar', async ({ page }) => {
  const businessName = uniqueName('Paseos Enlace');
  const walker = await createWalker({ businessName });
  const slug = await publicSlug(walker.accountId);

  await page.goto(`/s/${slug}`);
  await page.getByText('Reservar en PawMates').click();

  // The business opens right away, before any sign-in.
  await expect(page.getByText(businessName).filter({ visible: true })).toBeVisible();
  await page.getByText('Reservar', { exact: true }).click();

  // Booking needs an account: Login, then "sign up" from there.
  await page.getByText('¿No tienes cuenta? Regístrate').click();
  await page.getByPlaceholder('Tu nombre').filter({ visible: true }).fill('Marta');
  await page.getByPlaceholder('tu@correo.com').filter({ visible: true }).fill(uniqueEmail('marta'));
  await page.getByPlaceholder('Mínimo 8 caracteres').filter({ visible: true }).fill('Password1!');
  await page.getByPlaceholder('Escríbela otra vez').filter({ visible: true }).fill('Password1!');
  await page.getByRole('checkbox').filter({ visible: true }).first().click();
  await page.getByText('Crear cuenta', { exact: true }).last().click();

  // A new owner adds their pet first, then lands back on the business.
  await page.getByPlaceholder('Rocky').fill('Canela');
  await page.getByPlaceholder('Labrador retriever').fill('Mestiza');
  await page.getByText('Guardar y continuar').click();

  await expect(page.getByText(businessName).filter({ visible: true })).toBeVisible();
  await page.getByText('Reservar', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Solicitar paseo').filter({ visible: true })).toBeVisible();
  // The link is used up: the address bar no longer points at it.
  expect(new URL(page.url()).pathname).not.toContain('/reservar');
});

test('una dueña con sesión abierta va directo al negocio', async ({ page }) => {
  const businessName = uniqueName('Paseos Directo');
  const walker = await createWalker({ businessName });
  const slug = await publicSlug(walker.accountId);
  const owner = await createOwner('Rosa');

  await openAs(page, owner, `/s/${slug}/reservar`);
  await expect(page.getByText(businessName).filter({ visible: true })).toBeVisible();
  await page.getByText('Reservar', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Solicitar paseo').filter({ visible: true })).toBeVisible();
});

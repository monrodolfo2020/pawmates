import { expect, test } from '@playwright/test';
import { createOwner, createWalker, openAs, openInNewContext, uniqueName } from './helpers';

test('la dueña solicita un paseo, el negocio lo acepta y ella ve la confirmación', async ({ page, browser }) => {
  const businessName = uniqueName('Paseos');
  const walker = await createWalker({ businessName });
  const owner = await createOwner();

  await openAs(page, owner);
  await page.getByText(businessName).first().click();
  await page.getByText('Reservar', { exact: true }).click();
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByText('10:00', { exact: true }).click();
  await page.getByText('Revisar solicitud').click();

  // The summary tells the truth: the business's own rate, no commission.
  await expect(page.getByText('$150 MXN por paseo')).toBeVisible();
  await expect(page.getByText(/no cobra este paseo ni ninguna comisión/)).toBeVisible();
  await page.getByText('Enviar solicitud').click();
  await expect(page.getByText('Solicitud enviada')).toBeVisible();

  const walkerPage = await openInNewContext(browser, walker);
  await expect(walkerPage.getByText('Toby · Beagle').first()).toBeVisible();
  await expect(walkerPage.getByText(/10:00/).first()).toBeVisible();
  await walkerPage.getByText('Aceptar', { exact: true }).click();

  // The owner's screen notices on its own.
  await expect(page.getByText('¡Paseo confirmado!')).toBeVisible({ timeout: 20_000 });

  // "Tus reservas" says with whom and for which pet.
  await openAs(page, owner);
  await page.getByText('Menú', { exact: true }).click();
  await page.getByText('Reservas', { exact: true }).click();
  await expect(page.getByText('Próximas')).toBeVisible();
  await expect(page.getByText(businessName).filter({ visible: true })).toBeVisible();
  await expect(page.getByText(/Paseo de Toby/).filter({ visible: true })).toBeVisible();
});

test('"Conócenos primero" pide día y hora, y el negocio la recibe a esa hora', async ({ page, browser }) => {
  const businessName = uniqueName('Paseos Conocer');
  const walker = await createWalker({ businessName });
  const owner = await createOwner();

  await openAs(page, owner);
  await page.getByText(businessName).first().click();
  await page.getByText('Conócenos primero').click();
  const send = page.getByText('Solicitar Meet & Greet');
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByText('17:30', { exact: true }).click();
  await send.click();
  await expect(page.getByText(/Pediste conocerse el .*17:30/)).toBeVisible();

  const walkerPage = await openInNewContext(browser, walker);
  await expect(walkerPage.getByText(/Meet & Greet/).first()).toBeVisible();
  await expect(walkerPage.getByText(/17:30/).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { confirmedWalk, createOwner, createWalker, openAs, openInNewContext, uniqueName } from './helpers';

test('el negocio hace el paseo desde su teléfono y la dueña lo sigue en vivo', async ({ page, browser }) => {
  const walker = await createWalker({ businessName: uniqueName('Paseos Vivos') });
  const owner = await createOwner();
  await confirmedWalk(owner, walker, new Date(Date.now() + 30 * 60_000));

  let position = { latitude: 19.26, longitude: -99.605 };
  const walkerPage = await openInNewContext(browser, walker, '/', { geolocation: position });
  await walkerPage.getByText('Iniciar paseo', { exact: true }).first().click();
  await walkerPage.getByText('Iniciar paseo', { exact: true }).last().click();
  await expect(walkerPage.getByText('● En vivo')).toBeVisible();

  for (let i = 1; i <= 3; i++) {
    position = { latitude: 19.26 + i * 0.0008, longitude: -99.605 + i * 0.0005 };
    await walkerPage.context().setGeolocation(position);
    await walkerPage.waitForTimeout(6_000);
  }
  await walkerPage.getByText('💧 Pipí').click();

  // The owner only watches: no buttons to log or finish.
  await openAs(page, owner);
  await page.getByText('Menú', { exact: true }).click();
  await page.getByText('Reservas', { exact: true }).click();
  await page.getByText('● Ver en vivo').click();
  await expect(page.getByText('● En vivo')).toBeVisible();
  await expect(page.getByText('Pipí').first()).toBeVisible();
  await expect(page.getByText(/0\.[1-9]\d km/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Terminar paseo')).toHaveCount(0);

  await walkerPage.getByText('Terminar paseo').click();
  await expect(page.getByText('✓ Terminado')).toBeVisible({ timeout: 15_000 });
});

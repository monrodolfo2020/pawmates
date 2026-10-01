import { expect, test } from '@playwright/test';
import { createOwner, createWalker, openAs, uniqueName } from './helpers';

test('la dueña cierra sesión desde el menú del celular, sin entrar a su perfil', async ({ page }) => {
  const owner = await createOwner();
  await openAs(page, owner);
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByText('Salir', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Ver servicios cerca de ti').filter({ visible: true })).toBeVisible();
  // Gone for good, not just hidden: the saved session is cleared.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pawmates.session'))).toBeNull();
});

test('el negocio cierra sesión desde la barra de arriba en la PC', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const walker = await createWalker({ businessName: uniqueName('Paseos Salida') });
  await openAs(page, walker);
  await page.getByText('Salir', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Ver servicios cerca de ti').filter({ visible: true })).toBeVisible();
});

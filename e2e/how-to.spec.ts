import { expect, test } from '@playwright/test';
import { createWalker, openAs, uniqueName } from './helpers';

test('quien tiene un negocio ve los videos de cómo funciona, desde la bienvenida y desde su panel', async ({ page }) => {
  await page.goto('/');
  await page.getByText('¿Tienes un negocio? Mira cómo funciona').click();
  await expect(page.getByText('Cómo funciona', { exact: true }).filter({ visible: true })).toBeVisible();
  for (const title of ['PET Conect@ para tu negocio', 'Registra tu negocio', 'Arma tu página', 'Recibe reservas', 'Reseñas y huesitos']) {
    await expect(page.getByText(title, { exact: true }).filter({ visible: true })).toBeVisible();
  }
  await page.getByText('Registra tu negocio', { exact: true }).filter({ visible: true }).click();
  const video = page.locator('video');
  await expect(video).toHaveCount(1);
  // Playwright's Chromium has no H.264, so this checks which file the
  // player got rather than playing it (real browsers and phones do).
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc || v.src)).toMatch(/registro.*\.mp4/);
  await page.getByLabel('Cerrar video').click();
  await expect(video).toHaveCount(0);

  const walker = await createWalker({ businessName: uniqueName('Paseos Videos') });
  await openAs(page, walker);
  await page.getByText('Aprende a usar PET Conect@').click();
  await expect(page.getByText('Reseñas y huesitos', { exact: true }).filter({ visible: true })).toBeVisible();
});

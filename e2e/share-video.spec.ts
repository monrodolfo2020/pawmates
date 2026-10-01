import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('un video se comparte con su propio enlace, y ese enlace lo abre directo', async ({ page }) => {
  await page.goto('/');
  await page.getByText('¿Tienes un negocio? Mira cómo funciona').click();
  await page.getByText('Registra tu negocio', { exact: true }).filter({ visible: true }).click();
  await page.getByLabel('Compartir video').click();

  for (const option of ['WhatsApp', 'Facebook', 'X (Twitter)', 'Correo', 'Descargar el video']) {
    await expect(page.getByText(option, { exact: true }).filter({ visible: true })).toBeVisible();
  }
  await page.getByText('Copiar enlace', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Enlace copiado', { exact: true }).filter({ visible: true })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\?video=registro$/);

  // Whoever receives it lands on that video, already open.
  const other = await page.context().newPage();
  await other.goto(link);
  const video = other.locator('video');
  await expect(video).toHaveCount(1);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc || v.src)).toMatch(/registro.*\.mp4/);
  await expect(other.getByText('Registra tu negocio', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  // The link is used once: the address no longer carries it.
  await expect.poll(() => other.url()).not.toContain('video=');
});

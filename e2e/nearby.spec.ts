import { expect, test } from '@playwright/test';
import { api, createBusiness, uniqueName } from './helpers';

// Centro de Toluca. The owner's position never leaves the browser: the
// app works out distances itself from the points businesses published.
const owner = { latitude: 19.2925, longitude: -99.6569 };

test.use({ geolocation: owner, permissions: ['geolocation'] });

test('"Ver servicios cerca de ti" muestra la distancia y pone primero al más cercano', async ({ page }) => {
  const nearName = uniqueName('Vet Cercana');
  const farName = uniqueName('Vet Lejana');
  await createBusiness({
    businessName: nearName,
    category: 'vet',
    location: { latitude: 19.2960, longitude: -99.6569 },
  });
  await createBusiness({
    businessName: farName,
    category: 'vet',
    location: { latitude: 19.4326, longitude: -99.1332 },
  });

  await page.goto('/');
  await page.getByText('Ver servicios cerca de ti').click();

  const nearCard = page.getByText(nearName, { exact: true }).filter({ visible: true });
  const farCard = page.getByText(farName, { exact: true }).filter({ visible: true });
  await expect(nearCard).toBeVisible();
  await expect(page.getByText('a 400 m', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('a 57 km', { exact: true }).filter({ visible: true }).first()).toBeVisible();

  const top = async (l: typeof nearCard) => (await l.boundingBox())!.y;
  expect(await top(nearCard)).toBeLessThan(await top(farCard));

  // The best-rated order is the server's own: back to it with one tap.
  const listed = await api<{ name: string }[]>('GET', '/v1/providers?category=vet');
  const names = listed.map((p) => p.name);
  const nearFirst = names.indexOf(nearName) < names.indexOf(farName);
  await page.getByRole('button', { name: 'Mejor calificados' }).click();
  await expect.poll(async () => (await top(nearCard)) < (await top(farCard))).toBe(nearFirst);
  await expect(page.getByText('a 57 km', { exact: true }).filter({ visible: true }).first()).toBeVisible();
});

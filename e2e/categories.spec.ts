import { expect, test } from '@playwright/test';
import { createBusiness, uniqueName } from './helpers';

test('las categorías se ven todas a la vez y filtran el directorio', async ({ page }) => {
  const vetName = uniqueName('Vet Cuadrícula');
  const groomerName = uniqueName('Estética Cuadrícula');
  await createBusiness({ businessName: vetName, category: 'vet' });
  await createBusiness({ businessName: groomerName, category: 'grooming' });

  await page.goto('/');
  await page.getByText('Ver servicios cerca de ti').click();

  // Every option is on screen without swiping.
  for (const label of ['Todos', 'Paseadores', 'Veterinarias', 'Estética', 'Hotel y guardería', 'Entrenamiento', 'Otros']) {
    await expect(page.getByRole('button', { name: label, exact: true }).filter({ visible: true })).toBeInViewport();
  }

  const vet = page.getByText(vetName, { exact: true }).filter({ visible: true });
  const groomer = page.getByText(groomerName, { exact: true }).filter({ visible: true });
  await expect(vet).toBeVisible();
  await expect(groomer).toBeVisible();

  await page.getByRole('button', { name: 'Veterinarias', exact: true }).filter({ visible: true }).click();
  await expect(vet).toBeVisible();
  await expect(groomer).toHaveCount(0);

  await page.getByRole('button', { name: 'Todos', exact: true }).filter({ visible: true }).click();
  await expect(groomer).toBeVisible();
});

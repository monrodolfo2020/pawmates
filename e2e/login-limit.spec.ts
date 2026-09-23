import { expect, test } from '@playwright/test';
import { createOwner, PASSWORD } from './helpers';

test('después de 5 contraseñas equivocadas la cuenta espera 15 minutos', async ({ page }) => {
  const owner = await createOwner();
  await page.goto('/');
  await page.getByText('Ya tengo cuenta · Iniciar sesión').click();
  await page.getByPlaceholder('tu@correo.com').fill(owner.email);

  for (let i = 1; i <= 5; i++) {
    await page.getByPlaceholder('••••••••').fill(`equivocada${i}`);
    await page.getByText('Entrar', { exact: true }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.').filter({ visible: true })).toBeVisible();
  }

  // Even the right password waits now.
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByText('Entrar', { exact: true }).click();
  await expect(page.getByText(/Demasiados intentos con esta cuenta. Espera 15 minutos/).filter({ visible: true })).toBeVisible();
});

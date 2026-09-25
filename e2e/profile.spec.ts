import { expect, test } from '@playwright/test';
import { PASSWORD, createOwner, openAs } from './helpers';

test('la dueña cambia su nombre y su contraseña, y entra con la nueva', async ({ page, browser }) => {
  const owner = await createOwner('Ana');
  await openAs(page, owner);
  await page.getByText('Menú', { exact: true }).click();
  await page.getByText('Perfil', { exact: true }).filter({ visible: true }).click();

  await page.getByText('Editar', { exact: true }).first().click();
  await page.getByPlaceholder('Tu nombre').filter({ visible: true }).fill('Ana María');
  await page.getByText('Guardar', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Guardamos tu nombre.')).toBeVisible();
  await expect(page.getByText('Ana María').first()).toBeVisible();

  await page.getByText('Cambiar contraseña', { exact: true }).first().click();
  await page.getByPlaceholder('••••••••').filter({ visible: true }).fill('equivocada');
  await page.getByPlaceholder('Mínimo 8 caracteres').filter({ visible: true }).fill('NuevaClave9');
  await page.getByPlaceholder('Escríbela otra vez').filter({ visible: true }).fill('NuevaClave9');
  await page.getByText('Cambiar contraseña', { exact: true }).last().click();
  await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible();

  await page.getByPlaceholder('••••••••').filter({ visible: true }).fill(PASSWORD);
  await page.getByText('Cambiar contraseña', { exact: true }).last().click();
  await expect(page.getByText('Cambiamos tu contraseña.')).toBeVisible();

  // A fresh browser, signing in with the new password.
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto('/');
  await fresh.getByText('Ya tengo cuenta · Iniciar sesión').click();
  await fresh.getByPlaceholder('tu@correo.com').fill(owner.email);
  await fresh.getByPlaceholder('••••••••').fill('NuevaClave9');
  await fresh.getByText('Entrar', { exact: true }).click();
  await expect(fresh.getByText('Servicios para tu mascota')).toBeVisible();
  await context.close();
});

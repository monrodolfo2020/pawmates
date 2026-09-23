import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Registro de un dueño', () => {
  test('se registra, acepta los documentos, agrega su mascota y llega al inicio', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Soy dueño de mascota — Registrarse').click();

    await page.getByPlaceholder('Tu nombre').fill('Lucía');
    await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('lucia'));
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
    await page.getByPlaceholder('Escríbela otra vez').fill('Password1!');

    const create = page.getByText('Crear cuenta', { exact: true }).last();
    // Nothing is created before the legal documents are accepted.
    await page.getByRole('checkbox').first().click();
    await create.click();

    // Owners go straight to their pet; only businesses verify their email first.
    await expect(page.getByText('Cuéntanos de tu perro')).toBeVisible();
    await page.getByPlaceholder('Rocky').fill('Rocky');
    await page.getByPlaceholder('Labrador retriever').fill('Labrador');
    await page.getByText('Guardar y continuar').click();

    await expect(page.getByText('Rocky').first()).toBeVisible();
    await expect(page.getByText('Servicios para tu mascota')).toBeVisible();
  });

  test('no deja crear la cuenta si las contraseñas no coinciden', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Soy dueño de mascota — Registrarse').click();
    await page.getByPlaceholder('Tu nombre').fill('Lucía');
    await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('lucia'));
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
    await page.getByPlaceholder('Escríbela otra vez').fill('Password2!');
    await page.getByRole('checkbox').first().click();

    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await page.getByText('Crear cuenta', { exact: true }).last().click();
    await expect(page.getByText('Cuéntanos de tu perro')).toHaveCount(0);
  });
});

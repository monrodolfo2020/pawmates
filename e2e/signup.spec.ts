import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Registro de un dueño', () => {
  test('se registra, acepta los documentos, agrega su mascota y llega al inicio', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Soy dueño').click();

    await page.getByPlaceholder('Tu nombre').fill('Lucía');
    await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('lucia'));
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
    await page.getByPlaceholder('Escríbela otra vez').fill('Password1!');

    const create = page.getByText('Crear cuenta', { exact: true }).last();
    // Nothing is created before the legal documents are accepted.
    await page.getByRole('checkbox').first().click();
    await create.click();

    // Owners go straight to their pet; only businesses verify their email first.
    await expect(page.getByText('Cuéntanos de tu mascota')).toBeVisible();
    await page.getByPlaceholder('Rocky').fill('Rocky');
    await page.getByPlaceholder('Labrador retriever').fill('Labrador');
    await page.getByText('Guardar y continuar').click();

    await expect(page.getByText('Rocky').first()).toBeVisible();
    await expect(page.getByText('Servicios para tu mascota')).toBeVisible();
  });

  test('no deja crear la cuenta si las contraseñas no coinciden', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Soy dueño').click();
    await page.getByPlaceholder('Tu nombre').fill('Lucía');
    await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('lucia'));
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
    await page.getByPlaceholder('Escríbela otra vez').fill('Password2!');
    await page.getByRole('checkbox').first().click();

    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await page.getByText('Crear cuenta', { exact: true }).last().click();
    await expect(page.getByText('Cuéntanos de tu mascota')).toHaveCount(0);
  });
});

test.describe('Registro de un negocio', () => {
  // A real (tiny) PNG, since the web picker reads and resizes the file.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR42mP8z8BQz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC',
    'base64',
  );

  const pickPhoto = async (page: import('@playwright/test').Page, label: string) => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByText(label, { exact: true }).locator('xpath=following::*[1]').click();
    await (await chooser).setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG });
  };

  test('se registra en tres pasos y puede regresar sin perder lo escrito', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Tengo un negocio').click();

    // Paso 1: el negocio. No avanza sin nombre.
    await expect(page.getByText('Paso 1 de 3')).toBeVisible();
    const next = page.getByText('Siguiente', { exact: true });
    await page.getByText('Veterinaria', { exact: true }).click();
    await page.getByPlaceholder('Ej. Veterinaria San Ángel').fill('Veterinaria Pasos');
    await next.click();

    // Paso 2: la cuenta. Regresar conserva el nombre del negocio.
    await expect(page.getByText('Paso 2 de 3')).toBeVisible();
    await page.getByLabel('Regresar').click();
    await expect(page.getByPlaceholder('Ej. Veterinaria San Ángel')).toHaveValue('Veterinaria Pasos');
    await next.click();

    await page.getByPlaceholder('Tu nombre').fill('Paula');
    await page.getByPlaceholder('tu@correo.com').fill(uniqueEmail('paula'));
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password1!');
    await page.getByPlaceholder('Escríbela otra vez').fill('Password1!');
    await next.click();

    // Paso 3: identidad y documentos.
    await expect(page.getByText('Paso 3 de 3')).toBeVisible();
    const create = page.getByText('Crear cuenta', { exact: true }).last();
    await pickPhoto(page, 'Foto de tu cara');
    await pickPhoto(page, 'Foto de tu identificación');
    await page.getByRole('checkbox').nth(0).click();
    await page.getByRole('checkbox').nth(1).click();
    await create.click();

    await expect(page.getByText('Verifica tu correo')).toBeVisible();
  });
});

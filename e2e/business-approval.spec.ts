import { expect, test } from '@playwright/test';
import { createAdmin, createWalker, openAs, openInNewContext, uniqueName } from './helpers';

test('un negocio nuevo no aparece hasta que el admin lo aprueba', async ({ page, browser }) => {
  const businessName = uniqueName('Paseos Pendientes');
  const walker = await createWalker({ businessName, approved: false });
  const admin = await createAdmin();

  // Complete, but not public yet — and the business is told so.
  await page.goto('/');
  await page.getByText('Ver servicios cerca de ti').click();
  await expect(page.getByText('Servicios para tu mascota')).toBeVisible();
  await expect(page.getByText(businessName)).toHaveCount(0);

  const walkerPage = await openInNewContext(browser, walker);
  await walkerPage.getByText('Editar mi página').first().click();
  await expect(walkerPage.getByText('Completa — esperando aprobación')).toBeVisible();

  const adminPage = await openInNewContext(browser, admin);
  await adminPage.getByText('Admin', { exact: true }).first().click();
  await adminPage.getByText('Negocios', { exact: true }).first().click();
  await adminPage
    .locator(`xpath=//*[text()="${businessName}"]/following::*[text()="Aprobar y enviarle su enlace"][1]`)
    .click();
  await expect(adminPage.getByText(businessName).first()).toBeVisible();

  await page.reload();
  await page.getByText('Ver servicios cerca de ti').click();
  await expect(page.getByText(businessName).first()).toBeVisible();

  await walkerPage.reload();
  await walkerPage.getByText('Editar mi página').first().click();
  await expect(walkerPage.getByText('Publicada — visible en el directorio')).toBeVisible();
});

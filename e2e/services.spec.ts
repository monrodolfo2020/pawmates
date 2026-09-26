import { expect, test } from '@playwright/test';
import { createOwner, createWalker, openAs, openInNewContext, uniqueName } from './helpers';

test('el negocio arma su lista de paseos y la dueña reserva uno con su precio y duración', async ({ page, browser }) => {
  const businessName = uniqueName('Paseos Lista');
  const walker = await createWalker({ businessName });
  const owner = await createOwner();

  // The business fills in two walks from "Editar mi página".
  const walkerPage = await openInNewContext(browser, walker);
  await walkerPage.getByText('Editar mi página').first().click();
  await expect(walkerPage.getByText('Tipos de paseo que ofreces')).toBeVisible();
  await walkerPage.getByLabel('Nombre del servicio 1').fill('Paseo individual');
  await walkerPage.getByLabel('Precio del servicio 1').fill('180');
  await walkerPage.getByLabel('Duración del servicio 1').fill('60');
  await walkerPage.getByText('Agregar servicio').click();
  await walkerPage.getByLabel('Nombre del servicio 2').fill('Paseo grupal largo');
  await walkerPage.getByLabel('Qué incluye el servicio 2').fill('Con otros 3 perros');
  await walkerPage.getByLabel('Precio del servicio 2').fill('250');
  await walkerPage.getByLabel('Duración del servicio 2').fill('90');
  await walkerPage.getByText('Guardar', { exact: true }).click();
  await expect(walkerPage.getByText('Guardando…')).toBeHidden();
  await expect(walkerPage.getByText(/no se pudo/i)).toBeHidden();

  // The owner sees them on the profile and taps one to book it.
  await openAs(page, owner);
  await page.getByText(businessName).first().click();
  await expect(page.getByText('Paseos y precios')).toBeVisible();
  await expect(page.getByText('Paseo individual')).toBeVisible();
  await page.getByText('Paseo grupal largo').click();

  // It arrives already chosen; its duration replaces the 30/60 choice.
  await expect(page.getByText('¿Qué paseo?')).toBeVisible();
  await expect(page.getByText('Duración', { exact: true })).toHaveCount(0);
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByText('10:00', { exact: true }).click();
  await page.getByText('Revisar solicitud').click();

  // Earlier screens stay mounted underneath; only the summary is visible.
  const summary = (text: string | RegExp) =>
    page.getByText(text, { exact: typeof text === 'string' }).filter({ visible: true });
  await expect(summary('Paseo grupal largo')).toBeVisible();
  await expect(summary('1 h 30 min')).toBeVisible();
  await expect(summary('$250 MXN')).toBeVisible();
  await page.getByText('Enviar solicitud').click();
  await expect(page.getByText('Solicitud enviada')).toBeVisible();

  // The business sees which walk was asked for.
  await walkerPage.reload();
  await expect(walkerPage.getByText(/Paseo grupal largo · 1 h 30 min/).first()).toBeVisible();
});

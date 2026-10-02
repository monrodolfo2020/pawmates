import { expect, test } from '@playwright/test';
import { createBusiness, endTrial, openAs, uniqueName } from './helpers';

test('el negocio ve en su panel cuántos visitaron su página y le escribieron por WhatsApp', async ({ browser, page }) => {
  const name = uniqueName('Vet Visitada');
  const business = await createBusiness({ businessName: name, category: 'vet' });

  // A shopper finds it in the directory, opens it and taps WhatsApp.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.route('https://wa.me/**', (route) => route.fulfill({ body: 'ok' }));
  await visitor.goto('/');
  await visitor.getByText('Ver servicios cerca de ti').click();
  await visitor.getByText(name, { exact: true }).filter({ visible: true }).click();
  const waRequest = visitor.waitForRequest((r) => r.url().includes('/events') && r.postData()?.includes('whatsapp') === true);
  await visitor.getByText('Contactar por WhatsApp').filter({ visible: true }).click();
  await waRequest;

  // During the free trial the business sees everything.
  await openAs(page, business);
  await expect(page.getByText('Tu página este mes').filter({ visible: true })).toBeVisible();
  await expect(page.getByLabel('Visitas: 1')).toBeVisible();
  await expect(page.getByLabel('WhatsApp: 1')).toBeVisible();
  await expect(page.getByLabel('Cómo llegar: 0')).toBeVisible();
});

test('sin VIP el negocio ve solo sus visitas y una invitación a VIP', async ({ page }) => {
  const business = await createBusiness({ businessName: uniqueName('Vet Sin VIP'), category: 'vet' });
  endTrial(business.accountId);
  await openAs(page, business);
  await expect(page.getByText('Función VIP').filter({ visible: true })).toBeVisible();
  await expect(page.getByLabel('Visitas: 0')).toBeVisible();
  await expect(page.getByLabel('WhatsApp: bloqueado')).toBeVisible();
  await expect(page.getByText('Ver plan VIP').filter({ visible: true }).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { api, createBusiness, createOwner, openAs, uniqueName } from './helpers';

test('el negocio responde una reseña desde su panel y la respuesta sale en su página', async ({ browser, page }) => {
  const name = uniqueName('Vet Responde');
  const vet = await createBusiness({ businessName: name, category: 'vet' });
  const owner = await createOwner('Marta Ruiz');
  await api('POST', `/v1/providers/${vet.accountId}/reviews`, {
    token: owner.token,
    body: { rating: 3, comment: 'Buena atención, pero esperamos mucho.' },
  });

  await openAs(page, vet);
  await expect(page.getByText('Reseñas de tu negocio').filter({ visible: true })).toBeVisible();
  await expect(page.getByText('1 sin responder').filter({ visible: true })).toBeVisible();
  await page.getByText('Responder', { exact: true }).filter({ visible: true }).click();
  await page.getByLabel('Tu respuesta').fill('Gracias, Marta. Ya sumamos a alguien en recepción.');
  await page.getByText('Publicar respuesta', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('Editar respuesta', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('1 sin responder')).toHaveCount(0);

  // Anyone opening the business sees the answer under the review.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto('/');
  await visitor.getByText('Ver servicios cerca de ti').click();
  await visitor.getByText(name, { exact: true }).filter({ visible: true }).click();
  await expect(visitor.getByText('Respuesta del negocio').filter({ visible: true })).toBeVisible();
  await expect(
    visitor.getByText('Gracias, Marta. Ya sumamos a alguien en recepción.').filter({ visible: true }),
  ).toBeVisible();
});

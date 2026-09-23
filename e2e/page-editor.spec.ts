import { expect, test } from '@playwright/test';
import { api, createWalker, endTrial, openAs, uniqueName } from './helpers';

// The page editor: free for 30 days after approval, then the page goes
// back to the standard design until the business pays.

async function slugOf(accountId: string) {
  return (await api<{ slug: string }>('GET', `/v1/providers/${accountId}`)).slug;
}

test('durante la prueba el negocio agrega un bloque, publica y se ve en su página', async ({ page }) => {
  const businessName = uniqueName('Paseos Editor');
  const walker = await createWalker({ businessName });

  await openAs(page, walker);
  await expect(page.getByText(/Prueba gratis · 30 días/)).toBeVisible();
  await page.getByText('Abrir el editor').click();
  await page.getByText('Edición', { exact: true }).click();

  await page.getByText('Agregar bloque', { exact: true }).click();
  await page.getByText('Lista de precios', { exact: true }).click();
  await page.getByPlaceholder('Servicio').fill('Paseo de 45 min');
  await page.getByPlaceholder('Precio (ej. $150)').fill('$120');
  await page.getByText('Listo', { exact: true }).click();

  // Not public until published.
  const slug = await slugOf(walker.accountId);
  await expect(page.getByText('Borrador guardado')).toBeVisible({ timeout: 10_000 });
  const before = await api<{ design: { sections: { type: string }[] } }>('GET', `/v1/providers/by-slug/${slug}`);
  expect(before.design.sections.some((s) => s.type === 'prices')).toBe(false);

  await page.getByText('Publicar', { exact: true }).click();
  await expect(page.getByText('Así la ven tus clientes')).toBeVisible();

  await page.goto(`/s/${slug}`);
  await expect(page.getByText('Paseo de 45 min')).toBeVisible();
  await expect(page.getByText('$120')).toBeVisible();
});

test('al terminar la prueba la página vuelve al diseño estándar y el editor se cierra', async ({ page }) => {
  const businessName = uniqueName('Paseos Vencidos');
  const walker = await createWalker({ businessName });
  await api('PATCH', '/v1/providers/me', {
    token: walker.token,
    body: { design: { sections: [{ id: 'b1', type: 'hero', enabled: true, data: { title: 'Los mejores paseos' } }] } },
  });
  await api('POST', '/v1/providers/me/design/publish', { token: walker.token });
  const slug = await slugOf(walker.accountId);

  await page.goto(`/s/${slug}`);
  await expect(page.getByText('Los mejores paseos')).toBeVisible();

  endTrial(walker.accountId);
  await page.reload();
  await expect(page.getByText(businessName).first()).toBeVisible();
  await expect(page.getByText('Los mejores paseos')).toHaveCount(0);

  await openAs(page, walker, '/');
  await expect(page.getByText('Prueba terminada')).toBeVisible();
  await page.getByText('Ver plan VIP').click();
  await page.getByText('Edición', { exact: true }).click();
  await expect(page.getByText('Tu prueba gratis terminó')).toBeVisible();
  await expect(page.getByText('Agregar bloque', { exact: true })).toHaveCount(0);
});

import { api, ApiError, setAccountDisabledHandler } from '../client';

function respond(status: number, body: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe('api client', () => {
  afterEach(() => setAccountDisabledHandler(null));

  it('returns the data of a successful response', async () => {
    respond(200, { data: [{ accountId: 'a' }] });
    await expect(api.listProviders()).resolves.toEqual([{ accountId: 'a' }]);
  });

  it("turns an error into an ApiError with the server's Spanish message and code", async () => {
    respond(429, {
      error: { code: 'rate_limit.exceeded', message: 'Demasiados intentos. Espera 15 minutos.', retryable: true },
    });
    const err = await api.login('a@t.app', 'x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      message: 'Demasiados intentos. Espera 15 minutos.',
      code: 'rate_limit.exceeded',
    });
  });

  it('signs out a suspended account the moment the server says so', async () => {
    const onDisabled = jest.fn();
    setAccountDisabledHandler(onDisabled);
    respond(403, { error: { code: 'auth.account_disabled', message: 'Tu cuenta está suspendida.' } });
    await expect(api.listPets('token')).rejects.toBeInstanceOf(ApiError);
    expect(onDisabled).toHaveBeenCalledWith('Tu cuenta está suspendida.');
  });

  it('sends the session token', async () => {
    respond(200, { data: [] });
    await api.listPets('my-token');
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer my-token');
  });
});

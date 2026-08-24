import { beforeEach, describe, expect, it, vi } from 'vitest';

const bootstrapApplication = vi.fn();

vi.mock('@angular/platform-browser', () => ({ bootstrapApplication }));
vi.mock('./app/app', () => ({ App: class App {} }));

describe('main', () => {
  beforeEach(() => {
    vi.resetModules();
    bootstrapApplication.mockReset();
  });

  it('Given the TankOS entrypoint, When bootstrapping succeeds, Then the root component is started with the application configuration', async () => {
    bootstrapApplication.mockResolvedValue(undefined);

    await import('./main');

    expect(bootstrapApplication).toHaveBeenCalledOnce();
    expect(bootstrapApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ providers: expect.any(Array) }),
    );
  });

  it('Given the TankOS entrypoint, When bootstrapping fails, Then the startup error is logged', async () => {
    const error = new Error('bootstrap failed');
    bootstrapApplication.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await import('./main');
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });
});

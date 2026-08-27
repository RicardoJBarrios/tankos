import { confirmAndRun, createFeedbackService } from './feedback';

describe('feedback service', () => {
  it('stores and dismisses messages through one neutral contract', () => {
    const service = createFeedbackService();
    const successId = service.success('Saved');
    service.info('Info');
    service.warning('Warning');
    service.error('Failed');

    expect(service.messages()).toHaveLength(4);
    service.dismiss(successId);
    expect(service.messages()).toHaveLength(3);
    expect(service.messages()).toContainEqual(
      expect.objectContaining({ kind: 'error', text: 'Failed' }),
    );
    service.clear();
    expect(service.messages()).toEqual([]);
  });

  it('stores an optional action without coupling the contract to a UI', () => {
    const service = createFeedbackService();
    const run = vi.fn();

    service.info('Undo available', { action: { label: 'Undo', run } });

    expect(service.messages()[0]?.action).toEqual({
      label: 'Undo',
      run,
    });
  });

  it('runs a command only after confirmation', async () => {
    const operation = vi.fn();
    const confirmation = { confirm: vi.fn(() => Promise.resolve(true)) };

    await expect(
      confirmAndRun(
        confirmation,
        { title: 'Delete', message: 'Confirm' },
        operation,
      ),
    ).resolves.toBe(true);
    expect(operation).toHaveBeenCalledOnce();
  });

  it('does not run a rejected command', async () => {
    const operation = vi.fn();
    const confirmation = { confirm: vi.fn(() => Promise.resolve(false)) };

    await expect(
      confirmAndRun(
        confirmation,
        { title: 'Delete', message: 'Confirm' },
        operation,
      ),
    ).resolves.toBe(false);
    expect(operation).not.toHaveBeenCalled();
  });
});

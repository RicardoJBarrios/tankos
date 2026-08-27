/* c8 ignore file -- Material overlays are exercised by the application E2E suite. */
import { MaterialConfirmationService } from './feedback-ui';

describe('feedback-ui', () => {
  it('exports the Material confirmation adapter', () => {
    expect(MaterialConfirmationService).toBeDefined();
  });
});

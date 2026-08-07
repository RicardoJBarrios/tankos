import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from './app.routes';
import { PrivateShell } from './shells/private-shell/private-shell';
import { PublicShell } from './shells/public-shell/public-shell';

describe('appRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes)],
    });
  });

  it('lazy loads the public shell at the root route', async () => {
    const harness = await RouterTestingHarness.create();

    await expect(harness.navigateByUrl('/', PublicShell)).resolves.toBeTruthy();
  });

  it('lazy loads the private CSR shell under /app', async () => {
    const harness = await RouterTestingHarness.create();

    await expect(
      harness.navigateByUrl('/app', PrivateShell),
    ).resolves.toBeTruthy();
  });
});

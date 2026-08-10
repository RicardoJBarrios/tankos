import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
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

  it('defines the Establish Aquarium child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/new',
    );
  });

  it('defines the List My Aquariums child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums',
    );
  });

  it('defines the Aquarium Workspace child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/current',
    );
  });

  it('defines the Configure Aquarium Timezone child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/timezone',
    );
  });

  it('defines the Configure Parameter Targets child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/parameter-targets',
    );
  });

  it('defines the Record Measurement child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/measurements/new',
    );
  });

  it('defines the List Measurements child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/measurements',
    );
  });

  it('defines the List Observations child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/observations',
    );
  });

  it('defines the Review Recent Timeline child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/timeline',
    );
  });

  it('defines the Record Care Work child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/care/new',
    );
  });

  it('defines the List Care Work child route', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.children?.map((route) => route.path)).toContain(
      'aquariums/care',
    );
  });
});

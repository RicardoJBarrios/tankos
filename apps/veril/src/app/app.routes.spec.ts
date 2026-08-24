import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from './app.routes';
import { PrivateShell } from './shells/private-shell/private-shell';
import { PublicShell } from './shells/public-shell/public-shell';
import { AUTHENTICATION_SESSION } from './shared/ui/providers';
import { keeperAccessGuard } from './shared/ui/guards/keeper-access.guard';
import { authenticatedAccessGuard } from './shared/ui/guards/authenticated-access.guard';
import { editorialAccessGuard } from './shared/ui/guards/editorial-access.guard';
import {
  PRIVATE_PRIMARY_DESTINATIONS,
  PRIVATE_ROUTE_PRESENTATION,
} from './shells/private-shell/private-route-presentation';

describe('appRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        {
          provide: AUTHENTICATION_SESSION,
          useValue: {
            getSnapshot: () =>
              Promise.resolve({
                userId: 'test-user',
                isAuthenticated: true,
                isKeeper: true,
                isEditorialAdmin: true,
              }),
          },
        },
      ],
    });
  });

  it('lazy loads the public shell at the root route', async () => {
    const harness = await RouterTestingHarness.create();

    await expect(harness.navigateByUrl('/', PublicShell)).resolves.toBeTruthy();
  });

  it('defines the public species profile route outside the private shell', () => {
    const publicRoute = appRoutes.find((route) => route.path === '');

    expect(publicRoute?.children?.map((route) => route.path)).toContain(
      'species-knowledge/:id',
    );
  });

  it('lazy loads the private CSR shell under /app', async () => {
    const harness = await RouterTestingHarness.create();

    await expect(
      harness.navigateByUrl('/app', PrivateShell),
    ).resolves.toBeTruthy();
  });

  it('redirects the private entry point to Hoy', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/app');

    expect(TestBed.inject(Router).url).toBe('/app/aquariums/current');
  });

  it('protects the private application with the keeper guard', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');

    expect(privateRoute?.canActivate).toContain(keeperAccessGuard);
  });

  it('protects editorial routes with the editorial claim', () => {
    const editorialRoute = appRoutes.find(
      (route) => route.path === 'editorial/species-knowledge',
    );
    expect(editorialRoute?.canActivate).toContain(editorialAccessGuard);
  });

  it('protects shared access and invitation acceptance with authentication', () => {
    expect(
      appRoutes.find((route) => route.path === 'access/accept')?.canActivate,
    ).toContain(authenticatedAccessGuard);
    expect(
      appRoutes.find((route) => route.path === 'shared/aquariums/:aquariumId')
        ?.canActivate,
    ).toContain(authenticatedAccessGuard);
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

  it('defines the four primary destinations in one presentation contract', () => {
    expect(PRIVATE_PRIMARY_DESTINATIONS).toEqual([
      { id: 'today', label: 'Hoy', route: '/app/aquariums/current' },
      { id: 'agenda', label: 'Agenda', route: '/app/aquariums/care/planned' },
      {
        id: 'history',
        label: 'Historial',
        route: '/app/aquariums/timeline',
      },
      { id: 'aquarium', label: 'Acuario', route: '/app/aquariums/manage' },
    ]);
  });

  it('classifies every private child route deliberately', () => {
    const privateRoute = appRoutes.find((route) => route.path === 'app');
    const childRoutes = privateRoute?.children ?? [];

    expect(childRoutes.find((route) => route.path === '')?.redirectTo).toBe(
      'aquariums/current',
    );
    for (const route of childRoutes.filter((route) => route.path !== '')) {
      expect(route.data?.['presentation']).toBeTruthy();
    }
    expect(PRIVATE_ROUTE_PRESENTATION.today.title).toBe('Hoy');
    expect(PRIVATE_ROUTE_PRESENTATION.agenda.title).toBe('Agenda');
    expect(PRIVATE_ROUTE_PRESENTATION.timeline.title).toBe('Historial');
    expect(PRIVATE_ROUTE_PRESENTATION.manageAquarium.title).toBe('Acuario');
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

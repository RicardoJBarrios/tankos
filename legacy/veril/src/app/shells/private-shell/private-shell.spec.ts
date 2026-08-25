import { Spectator, createComponentFactory } from '@ngneat/spectator/vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ReadAquariumDashboardContext } from '../../aquarium-management/application/read-aquarium-dashboard-context';
import { RestoreActiveAquarium } from '../../aquarium-management/application/restore-active-aquarium';
import { PrivateShell } from './private-shell';
import { PRIVATE_ROUTE_PRESENTATION } from './private-route-presentation';

@Component({
  standalone: true,
  template: '<span>test route</span>',
})
class TestRoute {}

describe('PrivateShell', () => {
  const restore = vi.fn().mockResolvedValue(undefined);
  const read = vi.fn();
  const activeContext = {
    get: vi.fn<() => string | null>(() => null),
  };

  const createComponent = createComponentFactory({
    component: PrivateShell,
    providers: [
      provideRouter([
        {
          path: 'app/aquariums/current',
          data: {
            presentation: {
              kind: 'top-level',
              title: 'Hoy',
              primaryDestination: 'today',
              showRecordEntry: true,
            },
          },
          component: TestRoute,
        },
      ]),
    ],
    overrideComponents: [
      [
        PrivateShell,
        {
          set: {
            providers: [
              {
                provide: RestoreActiveAquarium,
                useValue: { execute: restore },
              },
              {
                provide: ReadAquariumDashboardContext,
                useValue: { execute: read },
              },
              { provide: ActiveAquariumContext, useValue: activeContext },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    restore.mockClear();
    read.mockReset();
    activeContext.get.mockReturnValue(null);
  });

  it('renders the contextual shell and all primary destinations', async () => {
    const spectator: Spectator<PrivateShell> = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.query('.page-title')?.textContent).toContain(
      'Mis acuarios',
    );
    expect(spectator.query('router-outlet')).toBeTruthy();
    expect(spectator.queryAll('nav').length).toBe(3);
    expect(spectator.queryAll('nav a')).toHaveLength(12);
    expect(spectator.queryAll('nav a')[0].textContent).toContain('Hoy');
    expect(spectator.query('button')?.textContent).toContain('Más');
  });

  it('marks the current primary destination with aria-current', async () => {
    const spectator: Spectator<PrivateShell> = createComponent();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/app/aquariums/current');
    spectator.detectChanges();

    expect(spectator.queryAll('a[aria-current="page"]')).toHaveLength(3);
    expect(spectator.query('.page-title')?.textContent).toContain('Hoy');
  });

  it('shows the authorized active Aquarium name in the app bar', async () => {
    activeContext.get.mockReturnValue('aquarium-id');
    read.mockResolvedValue({ name: { value: 'Arrecife' } });
    const spectator = createComponent();

    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.query('.active-aquarium')?.textContent).toContain(
      'Arrecife',
    );
  });

  it('shows Registrar only on a top-level destination with an active Aquarium', async () => {
    activeContext.get.mockReturnValue('aquarium-id');
    read.mockResolvedValue({ name: { value: 'Arrecife' } });
    const spectator = createComponent();

    await spectator.fixture.whenStable();
    spectator.component.presentation.set(PRIVATE_ROUTE_PRESENTATION.today);
    spectator.detectChanges();

    expect(spectator.query('button[aria-label="Registrar"]')).toBeTruthy();

    spectator.component.presentation.set(
      PRIVATE_ROUTE_PRESENTATION.aquariumList,
    );
    spectator.detectChanges();
    expect(spectator.query('button[aria-label="Registrar"]')).toBeFalsy();
  });

  it('does not show Registrar without an active Aquarium', async () => {
    const spectator = createComponent();

    await spectator.fixture.whenStable();
    spectator.component.presentation.set(PRIVATE_ROUTE_PRESENTATION.today);
    spectator.detectChanges();

    expect(spectator.query('button[aria-label="Registrar"]')).toBeFalsy();
  });
});

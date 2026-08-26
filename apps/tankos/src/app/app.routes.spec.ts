import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from './app.routes';

vi.mock('./units/units-page.component', () => ({
  UnitsPageComponent: class UnitsPageComponent {
    public readonly marker = true;
  },
}));
vi.mock('./dashboard/dashboard.component', () => ({
  DashboardComponent: class DashboardComponent {
    public readonly marker = true;
  },
}));

describe('appRoutes', () => {
  it('Given TankOS routes, When the units route is read, Then it is lazy and owns the units path', () => {
    const unitsRoute = appRoutes.find((route) => route.path === 'units');
    expect(unitsRoute?.loadComponent).toBeTypeOf('function');
  });

  it('Given the units route, When its lazy component is loaded, Then it resolves the feature component', async () => {
    const unitsRoute = appRoutes.find((route) => route.path === 'units');
    await expect(unitsRoute?.loadComponent?.()).resolves.toBeDefined();
  });

  it('keeps the dashboard as the root route', async () => {
    const dashboardRoute = appRoutes.find((route) => route.path === '');
    expect(dashboardRoute?.loadComponent).toBeTypeOf('function');
    await expect(dashboardRoute?.loadComponent?.()).resolves.toBeDefined();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from './app.routes';

vi.mock('./dashboard/dashboard.component', () => ({
  DashboardComponent: class DashboardComponent {
    public readonly marker = true;
  },
}));
vi.mock('@tankos/authn-firebase-ui', () => ({
  FirebaseLoginPageComponent: class FirebaseLoginPageComponent {
    public readonly marker = true;
  },
}));
vi.mock('@tankos/units-ui', () => ({
  unitsRoutes: [{ path: '' }],
}));
vi.mock('./forbidden/forbidden-page.component', () => ({
  ForbiddenPageComponent: class ForbiddenPageComponent {
    public readonly marker = true;
  },
}));

describe('appRoutes', () => {
  it('Given TankOS routes, When the units route is read, Then it is lazy and owns the units path', () => {
    const unitsRoute = appRoutes.find((route) => route.path === 'units');
    expect(unitsRoute?.loadChildren).toBeTypeOf('function');
  });

  it('Given the units route, When its lazy component is loaded, Then it resolves the feature component', async () => {
    const unitsRoute = appRoutes.find((route) => route.path === 'units');
    await expect(unitsRoute?.loadChildren?.()).resolves.toBeDefined();
  });

  it('keeps the dashboard as the root route', async () => {
    const dashboardRoute = appRoutes.find((route) => route.path === '');
    expect(dashboardRoute?.loadComponent).toBeTypeOf('function');
    await expect(dashboardRoute?.loadComponent?.()).resolves.toBeDefined();
  });

  it('loads the public login route without authentication', async () => {
    const loginRoute = appRoutes.find((route) => route.path === 'login');
    expect(loginRoute?.canActivate).toBeUndefined();
    await expect(loginRoute?.loadComponent?.()).resolves.toBeDefined();
  });

  it('loads the public forbidden route', async () => {
    const forbiddenRoute = appRoutes.find(
      (route) => route.path === 'forbidden',
    );
    await expect(forbiddenRoute?.loadComponent?.()).resolves.toBeDefined();
  });
});

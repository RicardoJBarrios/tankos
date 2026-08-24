import { describe, expect, it } from 'vitest';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('Given the initial TankOS application, When its routes are read, Then no route is registered before a feature is added', () => {
    expect(appRoutes).toEqual([]);
  });
});

import { expect, test } from '@playwright/test';

const unitsUrl = /\/units$/u;
const loginUrl = /\/login$/u;
const forbiddenUrl = /\/forbidden\?returnUrl=%2Funits$/u;

test.describe('authentication', () => {
  test('logs in and returns to the originally requested protected page', async ({
    page,
  }) => {
    await page.goto('/login?returnUrl=%2Funits');

    await page.getByTestId('login-email').fill('developer@tankos.local');
    await page.getByTestId('login-password').fill('tankos-local-dev');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(unitsUrl);
    await expect(
      page.getByRole('heading', { name: 'Units', level: 2 }),
    ).toBeVisible();
  });

  test('redirects an unauthenticated user to login', async ({ page }) => {
    await page.goto('/units');

    await expect(page).toHaveURL('/login?returnUrl=%2Funits');
  });

  test('shows the expected error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('developer@tankos.local');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toHaveText(
      'Unable to sign in. Check your credentials and try again.',
    );
    await expect(page).toHaveURL(loginUrl);
  });

  test('redirects an authenticated user without permission to the forbidden page', async ({
    page,
  }) => {
    await page.goto('/login?returnUrl=%2Funits');
    await page.getByTestId('login-email').fill('guest@tankos.local');
    await page.getByTestId('login-password').fill('tankos-local-guest');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(forbiddenUrl);
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
  });

  test('logs out and protects the units route again', async ({ page }) => {
    await page.goto('/login?returnUrl=%2Funits');
    await page.getByTestId('login-email').fill('developer@tankos.local');
    await page.getByTestId('login-password').fill('tankos-local-dev');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(unitsUrl);

    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(loginUrl);
    await page.goto('/units');
    await expect(page).toHaveURL('/login?returnUrl=%2Funits');
  });
});

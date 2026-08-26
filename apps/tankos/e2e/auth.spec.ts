import { expect, test } from '@playwright/test';

const unitsUrl = /\/units$/u;
const loginUrl = /\/login$/u;

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
      page.getByRole('heading', { name: 'Custom units' }),
    ).toBeVisible();
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
});

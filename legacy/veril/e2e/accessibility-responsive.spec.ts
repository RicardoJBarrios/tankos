import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'compact phone', width: 320, height: 568 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

test('private shell meets automated accessibility and responsive checks', async ({
  page,
}) => {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
  process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

  const fixture = JSON.parse(
    execFileSync(
      process.execPath,
      [path.resolve(process.cwd(), '../../tools/firebase/seed-keeper-e2e.mjs')],
      { encoding: 'utf8', env: process.env },
    ),
  ) as { credentials: { email: string; password: string } };

  await signIn(page, fixture.credentials);
  await expect(page).toHaveURL('/app/aquariums');

  await page.getByRole('link', { name: 'Establecer acuario' }).click();
  await page.getByLabel('Nombre del acuario').fill('Accessibility E2E');
  await page.getByRole('button', { name: 'Crear acuario' }).click();
  await expect(page).toHaveURL('/app/aquariums/current');

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { name: 'Accessibility E2E' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Hoy', exact: true }).first(),
    ).toHaveAttribute('aria-current', 'page');
    await expectNoHorizontalOverflow(page, viewport.name);
    await expectAutomatedAccessibility(page, viewport.name);
    await expectMinimumTouchTargets(page, viewport.name);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    )
    .toBe(true);
  await expectNoHorizontalOverflow(page, 'reduced motion');

  await page.goto('/app/aquariums/current');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Accessibility E2E' }),
  ).toBeVisible();
});

test('private shell keeps keyboard focus and reduced-motion semantics', async ({
  page,
}) => {
  await page.goto('/sign-in?switchAccount=true');
  await expect(page.getByTestId('sign-in-form')).toBeVisible();

  await page.getByTestId('sign-in-email').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible')).toHaveCount(1);
  await expect(page.locator(':focus-visible')).toHaveAttribute(
    'type',
    'password',
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    )
    .toBe(true);
});

async function expectAutomatedAccessibility(
  page: import('@playwright/test').Page,
  viewport: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `axe violations at ${viewport}`).toEqual([]);
}

async function signIn(
  page: import('@playwright/test').Page,
  credentials: { email: string; password: string },
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto('/sign-in?switchAccount=true');
    await page.getByTestId('sign-in-email').fill(credentials.email);
    await page.getByTestId('sign-in-password').fill(credentials.password);
    await page.getByTestId('sign-in-submit').click();
    if (page.url().endsWith('/app/aquariums')) return;
    await page.waitForTimeout(500);
  }
  await expect(page).toHaveURL('/app/aquariums');
}

async function expectNoHorizontalOverflow(
  page: import('@playwright/test').Page,
  viewport: string,
): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `horizontal overflow at ${viewport}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectMinimumTouchTargets(
  page: import('@playwright/test').Page,
  viewport: string,
): Promise<void> {
  const undersized = await page
    .locator('nav a, button, input, select, textarea')
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            label:
              element.textContent?.trim() || element.getAttribute('aria-label'),
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(
          ({ width, height }) => width > 0 && (width < 44 || height < 44),
        ),
    );

  expect(undersized, `undersized interactive controls at ${viewport}`).toEqual(
    [],
  );
}

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { expect, Page, test } from '@playwright/test';

process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

type E2eRolesFixture = {
  readonly password: string;
  readonly aquariumId: string;
  readonly invitationCode: string;
  readonly accountIds: Record<
    'keeper' | 'viewer' | 'editorial' | 'regular',
    string
  >;
  readonly accounts: Record<
    'keeper' | 'viewer' | 'editorial' | 'regular',
    string
  >;
};

function seedFixture(): E2eRolesFixture {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [path.resolve(process.cwd(), '../../tools/firebase/seed-e2e-roles.mjs')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        },
      },
    ),
  ) as E2eRolesFixture;
}

async function signIn(
  page: Page,
  email: string,
  password: string,
  route = '/sign-in',
): Promise<void> {
  await page.goto(route);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

async function selectAquarium(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'E2E Pagination Aquarium' }).click();
  await page
    .waitForURL('/app/aquariums/current', { timeout: 1_000 })
    .catch(() => undefined);
  if (!page.url().endsWith('/app/aquariums/current')) {
    await expect(page.getByTestId('active-aquarium-indicator')).toBeVisible();
    await page.goto('/app/aquariums/current');
  }
}

test('private area requires a keeper claim', async ({ page }) => {
  const fixture = seedFixture();

  await page.goto('/app/aquariums');
  await expect(page).toHaveURL('/sign-in');

  await signIn(page, fixture.accounts.regular, fixture.password);
  await page.goto('/app/aquariums');
  await expect(page).toHaveURL('/sign-in');
  await expect(
    page.getByRole('heading', { name: 'Acceso al área privada' }),
  ).toBeVisible();
});

test('editorial access is independent from keeper access', async ({ page }) => {
  const fixture = seedFixture();

  await signIn(
    page,
    fixture.accounts.editorial,
    fixture.password,
    '/editorial/sign-in',
  );
  await expect(page.getByRole('status')).toContainText('Sesión iniciada');

  await page.goto(`/editorial/species-knowledge/${fixture.aquariumId}`);
  await expect(page).not.toHaveURL('/editorial/sign-in');

  await page.goto('/app/aquariums');
  await expect(page).toHaveURL('/sign-in');
});

test('keeper sees the default page and can select only the bounded maximum', async ({
  page,
}) => {
  const fixture = seedFixture();

  await signIn(page, fixture.accounts.keeper, fixture.password);
  await expect(page).toHaveURL('/app/aquariums');
  await selectAquarium(page);
  await page.goto('/app/aquariums/measurements');

  const list = page.getByTestId('measurement-list');
  await expect(list.locator('li')).toHaveCount(20);
  await expect(list.locator('select')).toHaveValue('20');
  await expect(list.locator('option')).toHaveText(['10', '20', '50']);

  await list.locator('select').selectOption('50');
  await expect(list.locator('select')).toHaveValue('50');
  await expect(list.locator('li')).toHaveCount(50);
  await expect(list.getByRole('button', { name: 'Cargar más' })).toBeVisible();
});

test('a viewer can accept a scoped read-only invitation', async ({ page }) => {
  const fixture = seedFixture();
  await signIn(
    page,
    fixture.accounts.viewer,
    fixture.password,
    '/access/sign-in',
  );
  await page.getByLabel('Código de invitación').fill(fixture.invitationCode);
  await page.getByRole('button', { name: 'Aceptar' }).click();
  await expect(page.getByRole('status')).toContainText('Invitación aceptada');

  const adminApp =
    getApps().find((candidate) => candidate.name === 'veril-e2e-assertions') ??
    initializeApp({ projectId: 'demo-veril' }, 'veril-e2e-assertions');
  const grant = await getFirestore(adminApp)
    .collection('aquariumAccessGrants')
    .doc(`${fixture.aquariumId}_${fixture.accountIds.viewer}`)
    .get();
  expect(grant.exists).toBe(true);
  await page.goto(`/shared/aquariums/${fixture.aquariumId}`);
  await expect(
    page.getByRole('heading', { name: 'E2E Pagination Aquarium' }),
  ).toBeVisible();
  await expect(page.locator('body')).toContainText(
    'Solo se muestran las secciones para las que tienes permiso.',
  );
  await expect(page.locator('body')).not.toContainText('measurements:');
  await expect(page.locator('body')).not.toContainText('livestock:');
});

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@playwright/test';

type LivestockFixture = {
  credentials: { email: string; password: string };
  sourceAquariumId: string;
  destinationAquariumId: string;
  speciesProfileId: string;
};

function seedFixture(): LivestockFixture {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.resolve(
          process.cwd(),
          '../../tools/firebase/seed-livestock-e2e.mjs',
        ),
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        },
      },
    ),
  ) as LivestockFixture;
}

async function signIn(
  page: import('@playwright/test').Page,
  credentials: LivestockFixture['credentials'],
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      if (page.url().endsWith('/app/aquariums')) return;
      await expect(page.getByTestId('sign-in-form')).toBeVisible();
      await page.waitForTimeout(300);
      if (page.url().endsWith('/app/aquariums')) return;
      await page
        .getByTestId('sign-in-email')
        .fill(credentials.email, { timeout: 3_000 });
      await page
        .getByTestId('sign-in-password')
        .fill(credentials.password, { timeout: 3_000 });
      await page.getByTestId('sign-in-submit').click();
      await expect(page).toHaveURL('/app/aquariums', { timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(500);
    }
  }
}

async function selectAquarium(
  page: import('@playwright/test').Page,
  name: string,
): Promise<void> {
  await page.goto('/app/aquariums');
  const option = page.getByTestId('aquarium-option').filter({ hasText: name });
  await option.click();
  await expect(page).toHaveURL('/app/aquariums/current');
}

test('keeper can create, read, transfer and retire individual and group livestock', async ({
  page,
}) => {
  const fixture = seedFixture();
  await signIn(page, fixture.credentials);
  await selectAquarium(page, 'Livestock Aquarium A');

  await page.goto('/app/aquariums/livestock/new');
  await page.getByTestId('livestock-display-name').fill('Colonia E2E');
  await page
    .getByTestId('livestock-species-profile')
    .selectOption(fixture.speciesProfileId);
  await page.getByTestId('livestock-representation').selectOption('group');
  await page.getByTestId('livestock-category').selectOption('coral');
  await page.getByTestId('livestock-submit').click();
  await expect(page.getByRole('status')).toContainText(
    'Registro añadido correctamente.',
  );

  await page.goto('/app/aquariums/livestock');
  const livestockList = page.getByTestId('livestock-list');
  await expect(livestockList).toContainText('Colonia E2E');
  await expect(livestockList).toContainText('Grupo');
  await livestockList.getByRole('link', { name: 'Ver ficha' }).click();
  await expect(page.getByTestId('livestock-detail-name')).toHaveText(
    'Colonia E2E',
  );
  await expect(page.getByTestId('livestock-detail')).toContainText('Coral');
  await expect(page.getByTestId('livestock-detail')).toContainText('Activo');

  await page.goto('/app/aquariums/livestock/new');
  await page.getByTestId('livestock-display-name').fill('Nemo E2E');
  await page
    .getByTestId('livestock-species-profile')
    .selectOption(fixture.speciesProfileId);
  await page.getByTestId('livestock-representation').selectOption('individual');
  await page.getByTestId('livestock-category').selectOption('fish');
  await page.getByTestId('livestock-submit').click();
  await expect(page.getByRole('status')).toContainText(
    'Registro añadido correctamente.',
  );

  await page.goto('/app/aquariums/livestock/transfer');
  await page
    .getByTestId('livestock-transfer-record')
    .selectOption({ label: 'Colonia E2E' });
  await page
    .getByTestId('livestock-transfer-destination')
    .selectOption(fixture.destinationAquariumId);
  await page.getByTestId('livestock-transfer-submit').click();
  await expect(page.getByRole('status')).toContainText(
    'Transferencia realizada.',
  );

  await selectAquarium(page, 'Livestock Aquarium B');
  await page.goto('/app/aquariums/livestock');
  await expect(page.getByTestId('livestock-list')).toContainText('Colonia E2E');
  await page.getByRole('link', { name: 'Ver ficha' }).click();
  await expect(page.getByTestId('livestock-detail')).toContainText(
    fixture.sourceAquariumId,
  );
  await expect(page.getByTestId('livestock-detail')).toContainText(
    fixture.destinationAquariumId,
  );

  await selectAquarium(page, 'Livestock Aquarium A');
  await page.goto('/app/aquariums/livestock');
  await expect(page.getByTestId('livestock-list')).toContainText('Nemo E2E');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('livestock-remove').click();
  await expect(
    page.getByText('Aún no hay seres vivos registrados'),
  ).toBeVisible();

  await page.goto('/app/aquariums/livestock/history');
  const history = page.getByTestId('livestock-history-list');
  await expect(history).toContainText('Colonia E2E');
  await expect(history).toContainText('Nemo E2E');
  await expect(history).toContainText('Retirado');
  await expect(history).toContainText('Activo');
});

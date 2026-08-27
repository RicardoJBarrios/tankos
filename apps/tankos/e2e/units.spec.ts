import { expect, test, type Page } from '@playwright/test';

const uniqueCode = () =>
  `TANKOS:E2E-000-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
const unitsUrl = /\/units$/u;
const unitsPageOneUrl = /\/units\?page=1$/u;
const unitEditUrl = /\/units\/[^/]+\/edit$/u;
const loginPageUrl = /\/login$/u;
const recordQueryUrl = /\/units\?record=LTR$/u;
const detailRecordQueryUrl = /\/units\/[^?]+\?record=LTR$/u;
const recordBarQueryUrl = /\/units\?record=BAR$/u;
const ownerQueryUrl = /\/units\?owner=/u;
const publicQueryUrl = /\/units\?visibility=public$/u;
const publicRecordQueryUrl = /\/units\?visibility=public&record=LTR$/u;

async function login(
  page: Page,
  email = 'developer@tankos.local',
  password = 'tankos-local-dev',
): Promise<void> {
  await page.goto('/login?returnUrl=%2Funits');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(unitsUrl);
}

async function openCreateForm(page: Page) {
  await page.getByTestId('create').click();
  await expect(page.getByTestId('unit-definition-form')).toBeVisible();
}

async function fillUnit(
  page: Page,
  code: string,
  symbol = 'e2e',
  expectSuccess = true,
) {
  await page.getByTestId('unit-code').fill(code);
  await page.getByTestId('unit-symbol').fill(symbol);
  await page.getByTestId('unit-ascii-fallback').fill(symbol);
  await page.getByTestId('save-unit').click();
  if (expectSuccess) {
    await expect(page).toHaveURL(unitsUrl);
  } else {
    await expect(page.getByTestId('save-status')).toHaveText('error');
  }
}

async function confirmMaterial(page: Page, label: string): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('confirmation-confirm')).toHaveText(label);
  await dialog.getByTestId('confirmation-confirm').click();
}

test.describe('custom units', () => {
  test.describe.configure({ mode: 'serial' });

  test('creates and edits a custom unit with deleted versions hidden', async ({
    page,
  }) => {
    const code = uniqueCode();
    await login(page);
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    const publicRow = page
      .getByTestId('crud-row')
      .filter({ hasText: 'UN/CEFACT:LTR' });
    await expect(publicRow).toContainText('Public');
    await expect(publicRow.getByTestId('mark-for-deletion')).toHaveCount(0);
    await expect(publicRow.getByTestId('edit-unit')).toHaveCount(0);
    await page.getByTestId('unit-record-filter').fill('LTR');
    await expect(publicRow).toHaveCount(1);
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(recordQueryUrl);
    await expect(publicRow).toHaveCount(1);
    await page.goto('/units?record=LTR');
    await expect(page.getByTestId('unit-record-filter')).toHaveValue('LTR');
    await expect(publicRow).toHaveCount(1);
    await publicRow.getByTestId('detail-unit').click();
    await expect(page.getByTestId('unit-detail')).toBeVisible();
    await expect(page.getByTestId('unit-display-preview')).toHaveText('12 L');
    await expect(page).toHaveURL(detailRecordQueryUrl);
    await page.getByRole('link', { name: 'Back to units' }).click();
    await expect(page).toHaveURL(recordQueryUrl);
    await expect(page.getByTestId('unit-record-filter')).toHaveValue('LTR');
    await page.getByTestId('unit-record-filter').fill('');
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(unitsUrl);

    await openCreateForm(page);
    await fillUnit(page, code, 'u1');
    const row = page.getByTestId('crud-row').filter({ hasText: code });
    await expect(row).toContainText('(u1)');

    await row.getByTestId('edit-unit').click();
    await expect(page).toHaveURL(unitEditUrl);
    await expect(page.getByTestId('save-unit')).toHaveText('Update');
    await expect(page.getByTestId('unit-code')).toHaveAttribute('readonly', '');
    await expect(page.getByTestId('unit-symbol')).toHaveValue('u1');
    await expect(page.getByTestId('unit-display-preview')).toHaveText('12 u1');
    await expect(page.getByTestId('unit-position')).toHaveValue('suffix');
    await expect(page.getByTestId('unit-spacing')).toHaveValue('narrow');
    await page.getByTestId('unit-position').selectOption('prefix');
    await page.getByTestId('unit-spacing').selectOption('none');
    await expect(page.getByTestId('unit-display-preview')).toHaveText('u112');
    await page.getByTestId('unit-position').selectOption('suffix');
    await page.getByTestId('unit-spacing').selectOption('narrow');
    await page.getByTestId('unit-symbol').fill('u2');
    await page.getByTestId('unit-ascii-fallback').fill('u2');
    await expect(page.getByTestId('unit-display-preview')).toHaveText('12 u2');
    await page.getByTestId('save-unit').click();
    await expect(page).toHaveURL(unitsUrl);
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    await expect(page.getByRole('alert')).toHaveCount(0);
    const versions = page.getByTestId('crud-row').filter({ hasText: code });
    await expect(versions).toHaveCount(1);
    await expect(versions.filter({ hasText: `${code} (u2)` })).toHaveCount(1);
    await expect(
      versions.filter({ hasText: `${code} (u2)` }).getByRole('button', {
        name: 'Eliminar',
      }),
    ).toBeVisible();
    const updatedRow = page
      .getByTestId('crud-row')
      .filter({ hasText: `${code} (u2)` });
    await updatedRow.getByTestId('mark-for-deletion').click();
    await confirmMaterial(page, 'Move to recycle bin');
    await expect(page.getByTestId('lifecycle-status')).toHaveText('idle');
    await expect(
      page.getByTestId('crud-row').filter({ hasText: `${code} (u2)` }),
    ).toHaveCount(0);
  });

  test('paginates loaded units and resets pagination when searching', async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    await expect(page.getByTestId('crud-row')).toHaveCount(10);
    await expect(page.getByTestId('crud-row').first()).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:BAR (bar)',
    );
    await expect(page.getByTestId('crud-row').nth(9)).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:LTR (L)',
    );
    await expect(
      page.locator('[data-testid="crud-row"][data-record-label*="MLT"]'),
    ).toHaveCount(0);

    const nextPage = page.locator('[aria-label="Next page"]');
    await expect(nextPage).toBeEnabled();
    await nextPage.click();
    await expect(page).toHaveURL(unitsPageOneUrl);
    await expect(page.getByTestId('crud-row')).toHaveCount(3);
    await expect(page.getByTestId('crud-row').nth(0)).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:MLT (mL)',
    );
    await expect(page.getByTestId('crud-row').nth(1)).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:MTR (m)',
    );
    await expect(page.getByTestId('crud-row').nth(2)).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:PAL (Pa)',
    );

    await page.locator('[aria-label="Previous page"]').click();
    await expect(page).toHaveURL(unitsUrl);
    await expect(page.getByTestId('crud-row')).toHaveCount(10);
    await expect(page.getByTestId('crud-row').first()).toHaveAttribute(
      'data-record-label',
      'UN/CEFACT:BAR (bar)',
    );

    await page.getByTestId('unit-record-filter').fill('BAR');
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(recordBarQueryUrl);
    await expect(page.getByTestId('crud-row')).toHaveCount(1);
    await expect(page.getByTestId('crud-row')).toContainText('UN/CEFACT:BAR');
    await expect(page.locator('[aria-label="Previous page"]')).toBeDisabled();
  });

  test('shows an error when creating a duplicate custom-unit code', async ({
    page,
  }) => {
    const code = uniqueCode();
    await login(page);
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    await openCreateForm(page);
    await fillUnit(page, code);
    await expect(
      page.getByTestId('crud-row').filter({ hasText: code }),
    ).toBeVisible();

    await openCreateForm(page);
    await fillUnit(page, code, 'e2e', false);
    await expect(page.locator('.tankos-feedback-error')).toContainText(
      'Unable to save the unit.',
    );
  });

  test('does not show a private unit owned by another keeper', async ({
    browser,
    page,
  }) => {
    const code = uniqueCode();
    await login(page);
    await openCreateForm(page);
    await fillUnit(page, code, 'private');
    await expect(
      page.getByTestId('crud-row').filter({ hasText: code }),
    ).toBeVisible();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await login(
      otherPage,
      `other-${String(Date.now())}@tankos.local`,
      'tankos-local-dev',
    );
    await expect(otherPage.getByTestId('unit-list-status')).toHaveText('ready');
    await expect(
      otherPage.getByTestId('crud-row').filter({ hasText: code }),
    ).toHaveCount(0);
    await otherContext.close();
  });

  test('allows an admin to see all private units and create one', async ({
    page,
  }) => {
    const privateCode = uniqueCode();
    const adminCode = uniqueCode();
    await login(page);
    await openCreateForm(page);
    await fillUnit(page, privateCode, 'keeper-private');
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(loginPageUrl);

    await login(page, 'admin@tankos.local', 'tankos-local-admin');
    await expect(
      page.getByTestId('crud-row').filter({ hasText: privateCode }),
    ).toBeVisible();
    await expect(
      page.getByTestId('crud-row').filter({ hasText: privateCode }),
    ).toContainText('Private');
    const privateRow = page
      .getByTestId('crud-row')
      .filter({ hasText: privateCode });
    const ownerId = (
      await privateRow.locator('td').nth(2).textContent()
    )?.trim();
    expect(ownerId).toBeTruthy();
    await page.getByTestId('unit-owner-filter').fill(ownerId ?? '');
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(ownerQueryUrl);
    await expect(privateRow).toHaveCount(1);
    await page.getByTestId('unit-owner-filter').fill('');
    await page.getByTestId('apply-unit-filters').click();
    await expect(privateRow.getByTestId('mark-for-deletion')).toBeVisible();
    await expect(privateRow.getByTestId('publish')).toBeVisible();
    await privateRow.getByTestId('publish').click();
    await confirmMaterial(page, 'Make public');
    await expect(page.getByTestId('lifecycle-status')).toHaveText('idle');
    await expect(
      page.getByTestId('crud-row').filter({ hasText: privateCode }),
    ).toHaveCount(1);
    await page.getByTestId('unit-visibility-filter').selectOption('public');
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(publicQueryUrl);
    await expect(
      page.getByTestId('crud-row').filter({ hasText: privateCode }),
    ).toHaveCount(1);
    await expect(
      page.getByTestId('crud-row').filter({ hasText: privateCode }),
    ).toContainText('Public');
    await page.getByTestId('unit-record-filter').fill('LTR');
    await page.getByTestId('apply-unit-filters').click();
    await expect(page).toHaveURL(publicRecordQueryUrl);
    await expect(
      page.getByTestId('crud-row').filter({ hasText: 'UN/CEFACT:LTR' }),
    ).toContainText('Public');
    await page.getByTestId('unit-record-filter').fill('');
    await page.getByTestId('apply-unit-filters').click();
    await page.getByTestId('unit-visibility-filter').selectOption('deleted');
    await page.getByTestId('apply-unit-filters').click();
    const deletedPrivateRow = page
      .getByTestId('crud-row')
      .filter({ hasText: privateCode });
    await expect(
      deletedPrivateRow.getByTestId('physical-delete'),
    ).toBeVisible();
    await deletedPrivateRow.getByTestId('physical-delete').click();
    await confirmMaterial(page, 'Delete permanently');
    await expect(page.getByTestId('lifecycle-status')).toHaveText('idle');
    await page.getByTestId('unit-visibility-filter').selectOption('all');
    await page.getByTestId('apply-unit-filters').click();
    await openCreateForm(page);
    await fillUnit(page, adminCode, 'admin-private');
    await expect(
      page.getByTestId('crud-row').filter({ hasText: adminCode }),
    ).toBeVisible();
  });
});

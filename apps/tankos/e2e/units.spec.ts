import { expect, test, type Page } from '@playwright/test';

const uniqueCode = () =>
  `TANKOS:E2E-000-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;

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
  await page.getByTestId('unit-quantity-kind').fill('e2e quantity');
  await page.getByTestId('unit-conversion-family').fill('e2e family');
  await page.getByTestId('save-unit').click();
  await expect(page.getByTestId('save-status')).toHaveText(
    expectSuccess ? 'idle' : 'error',
  );
}

test.describe('custom units', () => {
  test('creates, edits, deletes and restores a custom unit', async ({
    page,
  }) => {
    const code = uniqueCode();
    await page.goto('/units');
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');

    await openCreateForm(page);
    await fillUnit(page, code, 'u1');
    const row = page.getByTestId('crud-row').filter({ hasText: code });
    await expect(row).toContainText('(u1)');

    await row.getByTestId('edit-unit').click();
    await expect(page.getByTestId('save-unit')).toHaveText('Update');
    await expect(page.getByTestId('unit-code')).toHaveAttribute('readonly', '');
    await expect(page.getByTestId('unit-symbol')).toHaveValue('u1');
    await page.getByTestId('unit-symbol').fill('u2');
    await page.getByTestId('unit-ascii-fallback').fill('u2');
    await page.getByTestId('save-unit').click();
    await expect(page.getByTestId('save-unit')).toHaveText('Save');
    await expect(page.getByTestId('save-status')).toHaveText('idle');
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    await expect(page.getByRole('alert')).toHaveCount(0);
    const versions = page.getByTestId('crud-row').filter({ hasText: code });
    await expect(versions).toHaveCount(2);
    await expect(versions.filter({ hasText: `${code} (u2)` })).toHaveCount(1);
    await expect(
      versions.filter({ hasText: `${code} (u2)` }).getByRole('button', {
        name: 'Eliminar',
      }),
    ).toBeVisible();
    await expect(
      versions.filter({ hasText: `${code} (u1)` }).getByRole('button', {
        name: 'Restaurar',
      }),
    ).toBeVisible();
    const versionIds = await versions.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-record-id')),
    );
    expect(new Set(versionIds).size).toBe(2);

    const updatedRow = page
      .getByTestId('crud-row')
      .filter({ hasText: `${code} (u2)` });
    await updatedRow.getByTestId('mark-for-deletion').click();
    await expect(page.getByTestId('lifecycle-status')).toHaveText('pending');
    await expect(page.getByTestId('lifecycle-status')).toHaveText('idle');
    await page.reload();
    const deletedRow = page
      .getByTestId('crud-row')
      .filter({ hasText: `${code} (u2)` });
    await expect(deletedRow).toContainText('Restaurar');
    await deletedRow.getByRole('button', { name: 'Restaurar' }).click();
    await expect(page.getByTestId('lifecycle-status')).toHaveText('pending');
    await expect(page.getByTestId('lifecycle-status')).toHaveText('idle');
    await page.reload();
    await expect(
      page.getByTestId('crud-row').filter({ hasText: `${code} (u2)` }),
    ).toContainText('(u2)');
  });

  test('shows an error when creating a duplicate custom-unit code', async ({
    page,
  }) => {
    const code = uniqueCode();
    await page.goto('/units');
    await expect(page.getByTestId('unit-list-status')).toHaveText('ready');
    await openCreateForm(page);
    await fillUnit(page, code);
    await expect(
      page.getByTestId('crud-row').filter({ hasText: code }),
    ).toBeVisible();

    await openCreateForm(page);
    await fillUnit(page, code, 'e2e', false);
    await expect(page.getByRole('alert')).toHaveText(
      'Unable to save the unit.',
    );
  });
});

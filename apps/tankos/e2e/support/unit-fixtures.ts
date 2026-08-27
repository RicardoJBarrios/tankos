import { expect, type Page } from '@playwright/test';

const unitsUrl = /\/units$/u;
let unitSequence = 0;

export function uniqueUnitCode(): string {
  const sequence = unitSequence++;
  return `TANKOS:E2E-000-${String(Date.now())}-${String(sequence)}`;
}

export async function loginAs(
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

export async function openUnitCreateForm(page: Page): Promise<void> {
  await page.getByTestId('create').click();
  await expect(page.getByTestId('unit-definition-form')).toBeVisible();
}

export async function saveUnit(
  page: Page,
  code: string,
  symbol = 'e2e',
  expectSuccess = true,
): Promise<void> {
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

export async function confirmMaterial(
  page: Page,
  label: string,
): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('confirmation-confirm')).toHaveText(label);
  await dialog.getByTestId('confirmation-confirm').click();
}

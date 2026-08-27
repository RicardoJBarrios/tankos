import { expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { execPath } from 'node:process';
import { workspaceRoot } from '@nx/devkit';

const unitsUrl = /\/units$/u;
let unitSequence = 0;

export async function resetUnitsEmulator(): Promise<void> {
  const response = await fetch(
    'http://127.0.0.1:8080/emulator/v1/projects/demo-tankos/databases/(default)/documents/units',
    { method: 'DELETE' },
  );
  if (!response.ok) throw new Error('Unable to reset the units emulator');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Node's child-process typings are unavailable in the browser test tsconfig.
  execFileSync(execPath, ['tools/seed-units.mjs'], {
    cwd: workspaceRoot,
    stdio: 'ignore',
  });
}

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

import { expect, test } from '@playwright/test';

test('a keeper can establish, select and record Aquarium evidence', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Área privada' }).click();
  await page.getByRole('link', { name: 'Mis acuarios' }).click();

  await expect(
    page.getByText('No has establecido ningún acuario todavía.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Establecer acuario' }).click();
  await page.getByLabel('Nombre del acuario').fill('Veril E2E');
  await page.getByRole('button', { name: 'Crear acuario' }).click();

  await expect(
    page.getByRole('status').filter({
      hasText: 'Acuario «Veril E2E» creado correctamente.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver mis acuarios' }).click();

  const aquarium = page.getByRole('button', { name: 'Veril E2E' });
  await expect(aquarium).toBeVisible();
  await aquarium.click();
  await expect(page).toHaveURL('/app/aquariums/current');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Veril E2E' })).toBeVisible();

  await page
    .getByLabel('Registrar')
    .getByRole('link', { name: 'Registrar observación' })
    .click();
  await page.getByLabel('¿Qué has observado?').fill('El coral está abierto.');
  await page.getByRole('button', { name: 'Guardar observación' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Observación guardada correctamente.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver observaciones' }).click();
  await expect(page).toHaveURL('/app/aquariums/observations');
  await expect(page.getByTestId('observation-list')).toContainText(
    'El coral está abierto.',
  );

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page.getByLabel('Acuario seleccionado')).toBeVisible();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await page.getByRole('link', { name: 'Registrar medición' }).click();
  await page.getByLabel('Valor').fill('25.4');
  await page.getByRole('button', { name: 'Guardar medición' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Medición guardada correctamente.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver mediciones' }).click();
  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await expect(page.getByTestId('current-measurements')).toContainText(
    '25.4 °C',
  );
  await expect(page.getByTestId('recent-activity-preview')).toContainText(
    'El coral está abierto.',
  );
  await expect(page.getByTestId('recent-activity-preview')).toContainText(
    '25.4 °C',
  );

  await page.getByRole('link', { name: 'Ver mediciones' }).click();
  await expect(page).toHaveURL('/app/aquariums/measurements');
  await expect(page.getByTestId('measurement-list')).toContainText('25.4 °C');

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await page.getByRole('link', { name: 'Ver toda la actividad' }).click();
  await expect(page).toHaveURL('/app/aquariums/timeline');
  await expect(page.getByTestId('recent-timeline')).toContainText(
    'El coral está abierto.',
  );
  await expect(page.getByTestId('recent-timeline')).toContainText('25.4 °C');

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page).toHaveURL('/app/aquariums');
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await page.getByRole('link', { name: 'Registrar cuidado' }).click();
  await page.getByLabel('¿Qué has hecho?').fill('Limpié la copa del skimmer.');
  await page.getByRole('button', { name: 'Guardar cuidado' }).click();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Cuidado guardado correctamente en el acuario seleccionado.',
    }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await expect(page.getByTestId('recent-activity-preview')).toContainText(
    'Limpié la copa del skimmer.',
  );
  await page.getByRole('link', { name: 'Ver toda la actividad' }).click();
  await expect(page.getByTestId('recent-timeline')).toContainText('Cuidado');
  await expect(page.getByTestId('recent-timeline')).toContainText(
    'Limpié la copa del skimmer.',
  );

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await page.getByRole('link', { name: 'Ver cuidados' }).click();
  await expect(page).toHaveURL('/app/aquariums/care');
  await expect(page.getByTestId('care-work-list')).toContainText(
    'Limpié la copa del skimmer.',
  );
});

test('protected recording pages recover when no Aquarium is selected', async ({
  page,
}) => {
  await page.goto('/app/aquariums/observations/new');

  await expect(page.locator('form')).toBeHidden();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Primero selecciona un acuario para registrar una observación.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page).toHaveURL('/app/aquariums');

  await page.goto('/app/aquariums/measurements/new');
  await expect(page.locator('form')).toBeHidden();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Primero selecciona un acuario para registrar una medición.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page).toHaveURL('/app/aquariums');

  await page.goto('/app/aquariums/care/new');
  await expect(page.locator('form')).toBeHidden();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Primero selecciona un acuario para registrar un cuidado.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page).toHaveURL('/app/aquariums');

  await page.goto('/app/aquariums/care');
  await expect(page.locator('ul')).toBeHidden();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Primero selecciona un acuario para consultar sus cuidados.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await expect(page).toHaveURL('/app/aquariums');
});

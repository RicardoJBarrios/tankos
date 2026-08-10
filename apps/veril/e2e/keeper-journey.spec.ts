import { expect, test } from '@playwright/test';

test('a keeper can establish, select and record Aquarium evidence', async ({
  page,
}) => {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            name: 'Santa Cruz de Tenerife',
            admin1: 'Canarias',
            country: 'España',
            latitude: 28.12,
            longitude: -16.46,
            timezone: 'Atlantic/Canary',
          },
        ],
      }),
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: { temperature_2m: 24.1, time: 1786356000 },
        daily: { temperature_2m_min: [19.2], temperature_2m_max: [27.8] },
      }),
    }),
  );
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
  await expect(page.getByTestId('aquarium-time-zone-missing')).toContainText(
    'Zona horaria sin configurar',
  );
  await page.getByRole('link', { name: 'Configurar zona horaria' }).click();
  await page.locator('#aquarium-time-zone').fill('Atlantic/Canary');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Configurar zona horaria' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Zona horaria configurada correctamente.',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).first().click();
  await expect(page.getByTestId('aquarium-time-zone')).toContainText(
    'Atlantic/Canary',
  );
  await expect(page.getByTestId('aquarium-location-missing')).toContainText(
    'Ubicación sin configurar',
  );
  await page.getByRole('link', { name: 'Configurar ubicación' }).click();
  await page.getByLabel('Localidad').fill('Santa Cruz');
  await page.getByRole('button', { name: 'Buscar ubicación' }).click();
  await page
    .getByRole('button', { name: 'Santa Cruz de Tenerife, Canarias, España' })
    .click();
  await page.getByRole('button', { name: 'Confirmar ubicación' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Ubicación configurada correctamente.',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).first().click();
  await expect(page.getByTestId('aquarium-location')).toContainText(
    'Santa Cruz de Tenerife, Canarias, España',
  );
  await expect(page.getByTestId('local-weather')).toContainText('24.1 °C');

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
  await expect(page.getByTestId('upcoming-care-preview')).toContainText(
    'No hay cuidados planificados',
  );

  await page.getByRole('link', { name: 'Ver mediciones' }).click();
  await expect(page).toHaveURL('/app/aquariums/measurements');
  await expect(page.getByTestId('measurement-list')).toContainText('25.4 °C');

  await page.getByRole('link', { name: 'Volver a mis acuarios' }).click();
  await page.getByRole('link', { name: 'Abrir acuario seleccionado' }).click();
  await page
    .getByTestId('upcoming-care-preview')
    .getByRole('link', { name: 'Planificar cuidado' })
    .click();
  await page
    .getByLabel('¿Qué quieres hacer?')
    .fill('Limpiar la copa del skimmer.');
  await page.getByLabel('Fecha y hora previstas').fill('2026-08-01T10:00');
  await page.getByRole('button', { name: 'Guardar planificación' }).click();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Cuidado planificado correctamente.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver cuidados planificados' }).click();
  await expect(page).toHaveURL('/app/aquariums/care/planned');
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'Limpiar la copa del skimmer.',
  );
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'Vencido',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await expect(page).toHaveURL('/app/aquariums/current');
  await expect(page.getByTestId('upcoming-care-preview')).toContainText(
    'Limpiar la copa del skimmer.',
  );
  await page
    .getByRole('link', { name: 'Ver todos los cuidados planificados' })
    .click();
  await expect(page).toHaveURL('/app/aquariums/care/planned');
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Cancelar Limpiar la copa del skimmer.' })
    .click();
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'No hay cuidados planificados',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await expect(page.getByTestId('upcoming-care-preview')).toContainText(
    'No hay cuidados planificados',
  );
  await page
    .getByTestId('upcoming-care-preview')
    .getByRole('link', { name: 'Planificar cuidado' })
    .click();
  await page
    .getByLabel('¿Qué quieres hacer?')
    .fill('Limpiar la copa del skimmer mañana.');
  await page.getByRole('button', { name: 'Guardar planificación' }).click();
  await expect(
    page.getByRole('status').filter({
      hasText: 'Cuidado planificado correctamente.',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver cuidados planificados' }).click();
  await page
    .getByRole('button', {
      name: 'Completar Limpiar la copa del skimmer mañana.',
    })
    .click();
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'No hay cuidados planificados',
  );

  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await expect(page.getByTestId('upcoming-care-preview')).toContainText(
    'No hay cuidados planificados',
  );
  await page.getByRole('link', { name: 'Ver cuidados' }).click();
  await expect(page.getByTestId('care-work-list')).toContainText(
    'Limpiar la copa del skimmer mañana.',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await page.getByRole('link', { name: 'Ver toda la actividad' }).click();
  await expect(page).toHaveURL('/app/aquariums/timeline');
  await expect(page.getByTestId('recent-timeline')).toContainText(
    'El coral está abierto.',
  );
  await expect(page.getByTestId('recent-timeline')).toContainText('25.4 °C');
  await expect(page.getByTestId('recent-timeline')).toContainText(
    'Limpiar la copa del skimmer mañana.',
  );

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

  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await page.getByRole('link', { name: 'Programar semanal' }).click();
  await page
    .getByLabel('¿Qué quieres hacer cada semana?')
    .fill('Cambio semanal de agua.');
  await page.getByLabel('Primera fecha y hora').fill('2026-08-16T10:00');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByLabel('Zona horaria del acuario')).toHaveValue(
    'Atlantic/Canary',
  );
  await page.getByRole('button', { name: 'Programar cuidado semanal' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Cuidado semanal programado correctamente.',
  );
  await page.getByRole('link', { name: 'Ver cuidados planificados' }).click();
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'Cambio semanal de agua.',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', {
      name: 'Detener recurrencia Cambio semanal de agua.',
    })
    .click();
  await expect(page.getByTestId('planned-care-work-list')).toContainText(
    'No hay cuidados planificados',
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

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('a keeper can establish, select and record Aquarium evidence', async ({
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
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(fixture.credentials.email);
  await page.getByLabel('Contraseña').fill(fixture.credentials.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL('/app/aquariums');

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
  await page.getByRole('link', { name: 'Objetivos de parámetros' }).click();
  await expect(page.getByTestId('parameter-targets')).toContainText(
    'Sin objetivo configurado',
  );
  await page
    .getByRole('button', { name: 'Configurar objetivo' })
    .first()
    .click();
  await page.getByLabel('Mínimo (°C)').fill('24');
  await page.getByLabel('Máximo (°C)').fill('26');
  await page.getByRole('button', { name: 'Guardar objetivo' }).click();
  await expect(page.getByTestId('parameter-targets')).toContainText(
    'Intervalo objetivo: 24 – 26 °C',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
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
  await expect(page.getByTestId('current-measurements')).toContainText(
    'Dentro del objetivo',
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

  await page.getByRole('link', { name: 'Objetivos de parámetros' }).click();
  await page.getByRole('button', { name: 'Editar objetivo' }).first().click();
  await page.getByLabel('Mínimo (°C)').fill('30');
  await page.getByLabel('Máximo (°C)').fill('31');
  await page.getByRole('button', { name: 'Guardar objetivo' }).click();
  await expect(page.getByTestId('parameter-targets')).toContainText(
    'Intervalo objetivo: 30 – 31 °C',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await expect(page.getByTestId('current-measurements')).toContainText(
    '25.4 °C',
  );
  await expect(page.getByTestId('current-measurements')).toContainText(
    'Por debajo del objetivo',
  );
  await page.getByRole('link', { name: 'Objetivos de parámetros' }).click();
  await page.getByRole('button', { name: 'Eliminar objetivo' }).first().click();
  await expect(page.getByTestId('parameter-targets')).toContainText(
    'Sin objetivo configurado',
  );
  await page.getByRole('link', { name: 'Volver al acuario' }).click();
  await expect(page.getByTestId('current-measurements')).toContainText(
    '25.4 °C',
  );
  await expect(page.getByTestId('current-measurements')).toContainText(
    'Sin objetivo configurado',
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

test('an editorial keeper can publish, compare and retire a species profile', async ({
  page,
}) => {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
  process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

  const fixture = JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.resolve(
          process.cwd(),
          '../../tools/firebase/seed-editorial-e2e.mjs',
        ),
      ],
      { encoding: 'utf8', env: process.env },
    ),
  ) as {
    profileId: string;
    credentials: { email: string; password: string };
  };

  let signedIn = false;
  for (let attempt = 0; attempt < 2 && !signedIn; attempt += 1) {
    await page.goto('/editorial/sign-in');
    await page.getByLabel('Email').fill(fixture.credentials.email);
    await page.getByLabel('Contraseña').fill(fixture.credentials.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    try {
      await expect(page.getByRole('status')).toContainText('Sesión iniciada', {
        timeout: 3_000,
      });
      signedIn = true;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  await page.goto(`/editorial/species-knowledge/${fixture.profileId}`);
  await expect(
    page.getByRole('heading', { name: 'Perfil de especie' }),
  ).toBeVisible();

  await page
    .getByLabel('Descripción (Markdown)')
    .fill('Descripción editorial **revisada** desde Playwright.');
  await page.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(page.getByRole('status')).toContainText('Borrador guardado.');

  await page.getByRole('button', { name: 'Marcar como revisado' }).click();
  await expect(
    page.getByRole('button', { name: 'Publicar revisión' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Publicar revisión' }).click();
  await expect(page.getByRole('status')).toContainText('Revisión publicada.');

  await page.getByRole('link', { name: 'Ver historial editorial' }).click();
  await expect(
    page.getByRole('heading', { name: 'Historial de revisiones' }),
  ).toBeVisible();
  await expect(page.locator('.markdown-content').first()).toContainText(
    'revisada',
  );
  await expect(page.getByText('Comparar revisiones')).toBeVisible();

  await page.goto(`/editorial/species-knowledge/${fixture.profileId}`);
  await page.getByRole('button', { name: 'Retirar perfil' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Perfil retirado. El historial permanece disponible.',
  );
});

test('protected recording pages recover when no Aquarium is selected', async ({
  page,
}) => {
  await page.goto('/app/aquariums/observations/new');
  await expect(page).toHaveURL('/sign-in');

  const fixture = JSON.parse(
    execFileSync(
      process.execPath,
      [path.resolve(process.cwd(), '../../tools/firebase/seed-keeper-e2e.mjs')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        },
      },
    ),
  ) as { credentials: { email: string; password: string } };
  await page.getByLabel('Email').fill(fixture.credentials.email);
  await page.getByLabel('Contraseña').fill(fixture.credentials.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL('/app/aquariums');

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

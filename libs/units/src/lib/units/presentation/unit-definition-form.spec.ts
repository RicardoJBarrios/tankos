import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import {
  createComponentFactory,
  type Spectator,
} from '@ngneat/spectator/vitest';
import { createEntityId, type CrudRecord } from '@tankos/data-access';
import { describe, expect, it } from 'vitest';
import {
  createUnitDefinitionForm,
  EMPTY_CUSTOM_UNIT_DRAFT,
  readUnitDefinitionDraft,
} from '../application/unit-definition-form';
import { createCustomUnitDefinition } from '../application/unit-definition-management-service';
import { UnitDefinitionFormComponent } from './unit-definition-form.component';
import type { UnitDefinition } from '../core';

setupTestBed({ zoneless: false });

describe('unit definition form', () => {
  const createComponent = createComponentFactory({
    component: UnitDefinitionFormComponent,
    detectChanges: false,
  });

  it('creates a non-nullable typed form with the default draft', () => {
    const form = createUnitDefinitionForm();

    expect(form.valid).toBe(true);
    expect(readUnitDefinitionDraft(form)).toEqual(EMPTY_CUSTOM_UNIT_DRAFT);
  });

  it('exposes invalid required fields and reads the edited draft', () => {
    const form = createUnitDefinitionForm();
    form.controls.code.setValue('');
    form.controls.symbol.setValue('µ');

    expect(form.invalid).toBe(true);
    expect(readUnitDefinitionDraft(form).symbol).toBe('µ');
  });

  it('emits the typed draft when a valid new form is submitted', () => {
    const spectator = renderComponent();
    let submitted: unknown;
    spectator.output('submitted').subscribe((value) => (submitted = value));

    spectator.click('button[type="submit"]');

    expect(submitted).toEqual(EMPTY_CUSTOM_UNIT_DRAFT);
  });

  it('synchronizes an existing record and shows update mode', () => {
    const spectator = renderComponent(createRecord('ALK', 'dKH'));

    expect(spectator.query('button[type="submit"]')?.textContent).toContain(
      'Update',
    );
    expect(spectator.query('input[formControlName="symbol"]')).toHaveValue(
      'dKH',
    );
    expect(spectator.query('button[type="button"]')).toBeTruthy();
  });

  it('does not emit an invalid form and emits cancellation', () => {
    const spectator = renderComponent();
    let submitted = false;
    spectator.output('submitted').subscribe(() => (submitted = true));
    const codeInput = spectator.query<HTMLInputElement>(
      'input[formControlName="code"]',
    );
    if (!codeInput) throw new Error('Code input was not rendered');
    codeInput.value = '';
    spectator.dispatchFakeEvent(codeInput, 'input');
    spectator.click('button[type="submit"]');

    expect(submitted).toBe(false);

    const existing = renderComponent(createRecord('PH', 'pH'));
    let cancelled = false;
    existing.output('cancelled').subscribe(() => (cancelled = true));
    existing.click('button[type="button"]');
    expect(cancelled).toBe(true);
  });

  function renderComponent(
    record?: CrudRecord<UnitDefinition>,
  ): Spectator<UnitDefinitionFormComponent> {
    const spectator = createComponent();
    spectator.setInput('record', record);
    spectator.detectChanges();
    return spectator;
  }

  function createRecord(
    code: string,
    symbol: string,
  ): CrudRecord<UnitDefinition> {
    return {
      id: createEntityId(`unit-${code.toLowerCase()}`),
      data: createCustomUnitDefinition({
        code: `TANKOS:CUSTOM-${code}`,
        symbol,
        asciiFallback: symbol,
        quantityKind: code.toLowerCase(),
        conversionFamily: code.toLowerCase(),
      }),
      lifecycle: { status: 'active' },
      revision: 1,
      metadata: {
        schemaVersion: 1,
        createdAt: { kind: 'instant', epochMilliseconds: 0 },
        updatedAt: { kind: 'instant', epochMilliseconds: 0 },
      },
    };
  }
});

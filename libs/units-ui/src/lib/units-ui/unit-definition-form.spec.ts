import { describe, expect, it } from 'vitest';
import {
  createUnitDefinitionForm,
  readUnitDefinitionDraft,
} from './unit-definition-form';

describe('unit-definition-form', () => {
  it('provides a complete default draft', () => {
    const form = createUnitDefinitionForm();
    expect(form.valid).toBe(true);
    expect(readUnitDefinitionDraft(form)).toMatchObject({
      code: 'TANKOS:CUSTOM',
      symbol: 'u',
    });
  });

  it('rejects missing required display values', () => {
    const form = createUnitDefinitionForm();
    form.controls.symbol.setValue('');
    form.controls.asciiFallback.setValue('');
    expect(form.valid).toBe(false);
  });

  it('keeps an edit code in the typed draft', () => {
    const form = createUnitDefinitionForm({
      code: 'TANKOS:CUSTOM-1',
      symbol: 'x',
      asciiFallback: 'x',
    });
    expect(readUnitDefinitionDraft(form).code).toBe('TANKOS:CUSTOM-1');
  });
});

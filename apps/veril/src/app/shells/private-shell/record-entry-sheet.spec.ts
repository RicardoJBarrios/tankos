import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RECORD_ENTRY_OPTIONS, RecordEntrySheet } from './record-entry-sheet';

describe('RecordEntrySheet', () => {
  const dismiss = vi.fn();
  const navigateByUrl = vi.fn();
  const createComponent = createComponentFactory({
    component: RecordEntrySheet,
    providers: [
      provideRouter([]),
      {
        provide: MatBottomSheetRef,
        useValue: { dismiss },
      },
      {
        provide: Router,
        useValue: { navigateByUrl },
      },
    ],
  });

  beforeEach(() => {
    dismiss.mockClear();
    navigateByUrl.mockClear();
  });

  it('lists the four existing recording choices', () => {
    const spectator: Spectator<RecordEntrySheet> = createComponent();

    expect(spectator.query('h2')?.textContent).toContain('Registrar');
    expect(
      spectator.queryAll('[data-testid="record-entry-option"]'),
    ).toHaveLength(4);
    expect(
      spectator.queryAll('.option-label').map((node) => node.textContent),
    ).toEqual(RECORD_ENTRY_OPTIONS.map((option) => option.label));
  });

  it('dismisses before navigating to the selected existing form', () => {
    const spectator = createComponent();

    spectator.click(
      spectator.queryAll('[data-testid="record-entry-option"]')[1],
    );

    expect(dismiss).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith(
      '/app/aquariums/measurements/new',
    );
  });
});

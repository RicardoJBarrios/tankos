/* c8 ignore file -- Material overlays are exercised by the application E2E suite. */
import {
  Component,
  effect,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
  ViewEncapsulation,
} from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import {
  CONFIRMATION_SERVICE,
  FEEDBACK_SERVICE,
  type ConfirmationRequest,
  type ConfirmationService,
  type FeedbackMessage,
} from '@tankos/feedback';

const TRANSIENT_FEEDBACK_DURATION_MS = 5000;

@Component({
  selector: 'tankos-feedback-outlet',
  imports: [MatDialogModule, MatSnackBarModule],
  template: '',
  encapsulation: ViewEncapsulation.None,
  styles: `
    .tankos-feedback-success {
      --mdc-snackbar-container-color: var(--mat-sys-primary-container);
    }
    .tankos-feedback-error {
      --mdc-snackbar-container-color: var(--mat-sys-error-container);
    }
    .tankos-feedback-warning {
      --mdc-snackbar-container-color: var(--mat-sys-tertiary-container);
    }
  `,
})
export class FeedbackMaterialOutletComponent {
  readonly #feedback = inject(FEEDBACK_SERVICE);
  readonly #snackBar = inject(MatSnackBar);
  readonly #shown = new Set<number>();

  public constructor() {
    effect(() => {
      for (const message of this.#feedback.messages()) {
        if (this.#shown.has(message.id)) continue;
        this.#shown.add(message.id);
        this.show(message);
      }
    });
  }

  private show(message: FeedbackMessage): void {
    const ref = this.#snackBar.open(
      message.text,
      message.action?.label ?? (message.dismissible ? 'Dismiss' : undefined),
      {
        duration:
          message.kind === 'error' ? undefined : TRANSIENT_FEEDBACK_DURATION_MS,
        politeness: message.kind === 'error' ? 'assertive' : 'polite',
        panelClass: `tankos-feedback-${message.kind}`,
      },
    );
    ref.onAction().subscribe(() => {
      if (message.action) void message.action.run();
      this.#feedback.dismiss(message.id);
    });
    ref.afterDismissed().subscribe(() => {
      this.#feedback.dismiss(message.id);
    });
  }
}

@Component({
  selector: 'tankos-confirm-dialog',
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title data-testid="confirmation-dialog-title">
      {{ data.title }}
    </h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-button
        type="button"
        data-testid="confirmation-cancel"
        [mat-dialog-close]="false"
      >
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        mat-flat-button
        color="warn"
        type="button"
        data-testid="confirmation-confirm"
        [mat-dialog-close]="true"
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class MaterialConfirmDialogComponent {
  protected readonly data = inject<ConfirmationRequest>(MAT_DIALOG_DATA);
}

export class MaterialConfirmationService implements ConfirmationService {
  readonly #dialog = inject(MatDialog);

  public confirm(request: ConfirmationRequest): Promise<boolean> {
    return firstValueFrom(
      this.#dialog
        .open(MaterialConfirmDialogComponent, {
          data: request,
          disableClose: true,
        })
        .afterClosed(),
    ).then((result) => result === true);
  }
}

export function provideMaterialFeedback() {
  return makeEnvironmentProviders([
    importProvidersFrom(MatDialogModule, MatSnackBarModule),
    { provide: CONFIRMATION_SERVICE, useClass: MaterialConfirmationService },
  ]);
}

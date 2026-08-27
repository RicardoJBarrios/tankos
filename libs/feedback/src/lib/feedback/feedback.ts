import { InjectionToken, signal } from '@angular/core';

export type FeedbackKind = 'success' | 'info' | 'warning' | 'error';

export interface FeedbackMessage {
  readonly id: number;
  readonly kind: FeedbackKind;
  readonly text: string;
  readonly dismissible: boolean;
  readonly action?: FeedbackAction;
}

export interface FeedbackAction {
  readonly label: string;
  readonly run: () => void | Promise<void>;
}

export interface FeedbackOptions {
  readonly dismissible?: boolean;
  readonly action?: FeedbackAction;
}

export interface ConfirmationRequest {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

export interface ConfirmationService {
  confirm(request: ConfirmationRequest): Promise<boolean>;
}

/** Runs a destructive or otherwise sensitive command only after confirmation. */
export async function confirmAndRun(
  confirmation: ConfirmationService,
  request: ConfirmationRequest,
  operation: () => void | Promise<void>,
): Promise<boolean> {
  if (!(await confirmation.confirm(request))) return false;
  await operation();
  return true;
}

export interface FeedbackService {
  readonly messages: ReturnType<typeof signal<readonly FeedbackMessage[]>>;
  show(kind: FeedbackKind, text: string, options?: FeedbackOptions): number;
  success(text: string, options?: FeedbackOptions): number;
  info(text: string, options?: FeedbackOptions): number;
  warning(text: string, options?: FeedbackOptions): number;
  error(text: string, options?: FeedbackOptions): number;
  dismiss(id: number): void;
  clear(): void;
}

export const FEEDBACK_SERVICE = new InjectionToken<FeedbackService>(
  'FEEDBACK_SERVICE',
  { providedIn: 'root', factory: createFeedbackService },
);

export const CONFIRMATION_SERVICE = new InjectionToken<ConfirmationService>(
  'CONFIRMATION_SERVICE',
);

export function createFeedbackService(): FeedbackService {
  return new SignalFeedbackService();
}

class SignalFeedbackService implements FeedbackService {
  public readonly messages = signal<readonly FeedbackMessage[]>([]);
  #nextId = 0;

  public show(
    kind: FeedbackKind,
    text: string,
    options: FeedbackOptions = {},
  ): number {
    const id = ++this.#nextId;
    this.messages.update((current) => [
      ...current,
      {
        id,
        kind,
        text,
        dismissible: options.dismissible ?? true,
        ...(options.action ? { action: options.action } : {}),
      },
    ]);
    return id;
  }

  public success(text: string, options?: FeedbackOptions): number {
    return this.show('success', text, options);
  }

  public info(text: string, options?: FeedbackOptions): number {
    return this.show('info', text, options);
  }

  public warning(text: string, options?: FeedbackOptions): number {
    return this.show('warning', text, options);
  }

  public error(text: string, options?: FeedbackOptions): number {
    return this.show('error', text, options);
  }

  public dismiss(id: number): void {
    this.messages.update((current) => current.filter((item) => item.id !== id));
  }

  public clear(): void {
    this.messages.set([]);
  }
}

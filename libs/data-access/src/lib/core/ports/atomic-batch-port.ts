/** Provider-neutral unit of an atomic multi-write operation. */
export type AtomicBatchOperation<TDocument = unknown> =
  | {
      readonly kind: 'set';
      readonly path: string;
      readonly document: TDocument;
    }
  | {
      readonly kind: 'update';
      readonly path: string;
      readonly patch: Readonly<Record<string, unknown>>;
    }
  | { readonly kind: 'delete'; readonly path: string };

/** Port for a finite all-or-nothing write batch. */
export interface AtomicBatchPort<TDocument = unknown> {
  commit(operations: readonly AtomicBatchOperation<TDocument>[]): Promise<void>;
}

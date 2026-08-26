import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { orderBy, query, type CollectionReference } from 'firebase/firestore';
import {
  createEntityId,
  createPageCursor,
  type CrudRecord,
  type EntityId,
} from '@tankos/data-access';
import { createCrudListStore, CrudListComponent } from '@tankos/data-access-ui';
import {
  createDimensionSignature,
  createQuantityKind,
  createStandardUnitCatalogue,
  createUnitCode,
  createUnitDefinition,
  createUnitDefinitionCrudService,
  createUnitRepresentation,
  type UnitDefinition,
} from '@tankos/units';
import { createUnitDefinitionFirestoreRepository } from '@tankos/units-firestore';
import { TIME_CLOCK, type ClockPort } from '@tankos/time';
import { ensureTankOsLocalUser, tankosFirestore } from '../firebase';

const PAGE = {
  pageSize: 50,
  orderBy: [{ field: 'data.code', direction: 'asc' as const }],
};

interface UnitDraft {
  code: string;
  symbol: string;
  asciiFallback: string;
  quantityKind: string;
  conversionFamily: string;
}

const EMPTY_DRAFT: UnitDraft = {
  code: 'TANKOS:CUSTOM',
  symbol: 'u',
  asciiFallback: 'u',
  quantityKind: 'custom',
  conversionFamily: 'custom',
};

function unitDocumentId(code: string): string {
  return code.replace(/[^0-9A-Za-z]+/gu, '-').toLowerCase();
}

function createDraftDefinition(draft: UnitDraft): UnitDefinition {
  return createUnitDefinition({
    code: createUnitCode(draft.code),
    system: 'custom',
    dimension: createDimensionSignature(),
    quantityKind: createQuantityKind(draft.quantityKind),
    representation: createUnitRepresentation({
      symbol: draft.symbol,
      asciiFallback: draft.asciiFallback,
      position: 'suffix',
      spacing: 'narrow',
    }),
    conversionFamily: draft.conversionFamily,
    catalogueVersion: 'TANKOS-CUSTOM-1',
    status: 'active',
  });
}

function createRepository(clock: ClockPort) {
  return createUnitDefinitionFirestoreRepository({
    firestore: tankosFirestore,
    collectionPath: 'units',
    clock,
    createId: (input: UnitDefinition) => unitDocumentId(String(input.code)),
    buildQuery: (reference: CollectionReference) =>
      query(reference, orderBy(PAGE.orderBy[0].field, 'asc')),
    encodeCursor: (snapshot) => createPageCursor(snapshot.id),
  });
}

@Component({
  selector: 'tankos-units-page',
  standalone: true,
  imports: [CrudListComponent, FormsModule, RouterLink],
  templateUrl: './units-page.component.html',
  styleUrl: './units-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitsPageComponent {
  private readonly clock = inject(TIME_CLOCK);
  protected readonly standardUnits = createStandardUnitCatalogue().list();
  private readonly service = createUnitDefinitionCrudService(
    createRepository(this.clock),
  );
  protected readonly store = new (createCrudListStore<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    unknown
  >({
    service: this.service,
    page: PAGE,
    schema: 'unit-definition',
  }))();
  protected readonly draft = signal<UnitDraft>({ ...EMPTY_DRAFT });
  protected readonly editingId = signal<EntityId | undefined>(undefined);
  protected readonly saveError = signal<unknown>(undefined);
  protected readonly authError = signal<unknown>(undefined);

  private readonly initialization = this.load();

  private async load(): Promise<void> {
    try {
      const user = await ensureTankOsLocalUser();
      await this.store.load({
        principalId: createEntityId(user.uid),
        roles: ['keeper'],
      });
    } catch (error) {
      this.authError.set(error);
    }
  }

  protected async save(): Promise<void> {
    this.saveError.set(undefined);
    try {
      const user = await ensureTankOsLocalUser();
      const access = {
        principalId: createEntityId(user.uid),
        roles: ['keeper'],
      };
      const definition = createDraftDefinition(this.draft());
      const id = this.editingId();
      if (!id) {
        await this.service.create({ access, input: definition });
      } else {
        await this.replaceExisting(id, definition, access);
      }
      this.cancelEdit();
      await this.store.load(access);
    } catch (error) {
      this.saveError.set(error);
    }
  }

  private async replaceExisting(
    id: EntityId,
    definition: UnitDefinition,
    access: { principalId: EntityId; roles: readonly string[] },
  ): Promise<void> {
    const record = this.store.items().find((item) => item.id === id);
    if (!record) throw new Error('Unit record is no longer available');
    await this.service.replace(
      { access, id, expectedRevision: record.revision },
      definition,
    );
  }

  protected edit(record: CrudRecord<UnitDefinition>): void {
    this.editingId.set(record.id);
    this.draft.set({
      code: record.data.code,
      symbol: record.data.representation.symbol,
      asciiFallback: record.data.representation.asciiFallback,
      quantityKind: record.data.quantityKind,
      conversionFamily: record.data.conversionFamily,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(undefined);
    this.draft.set({ ...EMPTY_DRAFT });
  }

  protected async markForDeletion(
    record: CrudRecord<UnitDefinition>,
  ): Promise<void> {
    const user = await ensureTankOsLocalUser();
    await this.store.markForDeletion({
      access: { principalId: createEntityId(user.uid), roles: ['keeper'] },
      id: record.id,
      expectedRevision: record.revision,
    });
  }

  protected async restore(record: CrudRecord<UnitDefinition>): Promise<void> {
    const user = await ensureTankOsLocalUser();
    await this.store.restore({
      access: { principalId: createEntityId(user.uid), roles: ['keeper'] },
      id: record.id,
      expectedRevision: record.revision,
    });
  }

  protected updateDraft(field: keyof UnitDraft, value: string): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
  }

  protected readonly label = formatUnitLabel;
}

function formatUnitLabel(record: CrudRecord<UnitDefinition>): string {
  return `${record.data.code} (${record.data.representation.symbol})`;
}

import type {
  UnitDefinitionCapabilities,
  UnitDefinitionRecord,
} from '@tankos/units';

export function cannotNavigateToUnitDefinitionPage(
  requested: number,
  current: number,
  hasMore: boolean,
  itemCount: number,
  pageSize: number,
): boolean {
  const localPageAvailable = requested * pageSize < itemCount;
  return (
    requested > current + 1 ||
    (requested === current + 1 && !hasMore && !localPageAvailable)
  );
}

export function parseUnitDefinitionPageIndex(value: string | null): number {
  const page = Number.parseInt(value ?? '0', 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 0;
}

export function unitVisibilityLabel(record: UnitDefinitionRecord): string {
  if (
    record.lifecycle.status === 'marked-for-deletion' ||
    record.lifecycle.status === 'deleted'
  ) {
    return 'Deleted';
  }
  return record.data.visibility === 'public' ? 'Public' : 'Private';
}

export const noUnitDefinitionCapabilities: UnitDefinitionCapabilities = {
  canCreate: false,
  canRead: false,
  canUse: false,
  canEdit: false,
  canDelete: false,
  canRestore: false,
  canPublish: false,
  canInspectDeleted: false,
  canFilterByOwner: false,
};

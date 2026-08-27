import type { UnitDefinitionFilter, UnitDefinitionRecord } from '@tankos/units';

/** Applies the exact partial match after Firestore returns bounded candidates. */
export function filterUnitDefinitionItems(
  items: readonly UnitDefinitionRecord[],
  filter: unknown,
): readonly UnitDefinitionRecord[] {
  if (!isUnitDefinitionFilter(filter)) return items;
  const record = filter.record?.trim().toLocaleLowerCase();
  const ownerName = filter.ownerName?.trim().toLocaleLowerCase();
  if (!record && !ownerName) return items;
  return items.filter((item) => {
    const code = item.data.code.toLocaleLowerCase();
    const owner = item.data.ownerName?.toLocaleLowerCase() ?? '';
    return (
      (!record || code.includes(record)) &&
      (!ownerName || owner.includes(ownerName))
    );
  });
}

function isUnitDefinitionFilter(value: unknown): value is UnitDefinitionFilter {
  return typeof value === 'object' && value !== null;
}

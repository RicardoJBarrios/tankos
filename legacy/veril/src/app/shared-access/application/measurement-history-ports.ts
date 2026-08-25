export type SharedMeasurementHistoryCursor = string & {
  readonly __sharedMeasurementHistoryCursor: unique symbol;
};

export type SharedMeasurementParameter =
  'temperature' | 'salinity' | 'alkalinity' | 'nitrate' | 'phosphate';

export interface SharedMeasurementHistoryFilter {
  readonly parameterId: SharedMeasurementParameter;
}

export interface SharedMeasurementHistoryItem {
  readonly id: string;
  readonly parameterId: SharedMeasurementParameter;
  readonly canonicalValue: number;
  readonly canonicalUnit: string;
  readonly measuredAt: Date;
  readonly recordedAt: Date;
  readonly correctsMeasurementId?: string;
}

export interface SharedMeasurementHistoryPage {
  readonly items: readonly SharedMeasurementHistoryItem[];
  readonly nextCursor?: SharedMeasurementHistoryCursor;
}

export interface SharedMeasurementHistoryReader {
  list(
    aquariumId: string,
    filter: SharedMeasurementHistoryFilter,
    cursor?: SharedMeasurementHistoryCursor,
    pageSize?: number,
  ): Promise<SharedMeasurementHistoryPage>;
}

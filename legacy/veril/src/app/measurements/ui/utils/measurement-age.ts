export interface MeasurementAgePresentation {
  readonly text: string;
}

export function measurementAgeFor(
  measuredAt: Date,
  now: Date,
): MeasurementAgePresentation {
  const elapsedSeconds = Math.floor(
    (now.getTime() - measuredAt.getTime()) / 1_000,
  );

  if (Number.isNaN(elapsedSeconds)) {
    throw new Error('Measurement timestamps must be valid dates');
  }

  if (elapsedSeconds < 0) return { text: 'Fecha futura' };
  if (elapsedSeconds < 60) return { text: 'Ahora' };

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) {
    return { text: `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` };
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return { text: `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}` };
  }

  const days = Math.floor(hours / 24);
  return { text: `Hace ${days} ${days === 1 ? 'día' : 'días'}` };
}

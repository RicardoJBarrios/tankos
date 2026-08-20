/** Zones available to Angular temporal presentation. */
export type TimeDisplayContext = Readonly<{
  /** Zone belonging to the aquarium currently being displayed. */
  aquariumTimeZone?: string;
  /** User fallback zone used when no aquarium zone exists. */
  userTimeZone?: string;
}>;

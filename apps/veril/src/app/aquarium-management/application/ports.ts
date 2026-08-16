import {
  AquariumId,
  AquariumLocation,
  AquariumName,
  AquariumTimeZone,
  ParameterTarget,
  ParameterTargets,
} from '../domain/aquarium';
import { ParameterId } from '../../shared/domain/parameter-reference';
export type { KeeperSession } from '../../shared/application/keeper-session';

export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
  readonly timeZone?: AquariumTimeZone;
  readonly location?: AquariumLocation;
  readonly parameterTargets?: ParameterTargets;
}

export interface AquariumListItem {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly timeZone?: AquariumTimeZone;
  readonly location?: AquariumLocation;
}

export interface AquariumReader {
  listOwned(ownerKeeperId: string): Promise<readonly AquariumListItem[]>;
  getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<AquariumListItem | null>;
}

export interface AquariumDashboardContext extends AquariumListItem {
  readonly parameterTargets: ParameterTargets;
}

export interface AquariumDashboardReader {
  getDashboardContextOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<AquariumDashboardContext | null>;
}

export interface EstablishAquariumInput {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
}

export interface AquariumRepository {
  establish(input: EstablishAquariumInput): Promise<Aquarium>;
}

export interface AquariumTimeZoneConfigurer {
  configure(input: ConfigureAquariumTimeZoneInput): Promise<AquariumTimeZone>;
}

export interface ConfigureAquariumTimeZoneInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly timeZone: AquariumTimeZone;
}

export interface AquariumLocationConfigurer {
  configureLocation(
    input: ConfigureAquariumLocationInput,
  ): Promise<AquariumLocation>;
}

export interface ConfigureAquariumLocationInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly location: AquariumLocation;
}

export interface ParameterTargetWriter {
  saveOwned(input: SaveParameterTargetInput): Promise<ParameterTarget>;
  removeOwned(input: RemoveParameterTargetInput): Promise<void>;
}

export interface SaveParameterTargetInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly target: ParameterTarget;
}
export interface RemoveParameterTargetInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly parameterId: ParameterId;
}

export interface LocationCandidate extends AquariumLocation {
  readonly suggestedTimeZone?: string;
}

export interface LocationSearch {
  search(query: string): Promise<readonly LocationCandidate[]>;
}

export interface LocalWeather {
  readonly currentTemperature: number;
  readonly todayMinTemperature: number;
  readonly todayMaxTemperature: number;
  readonly observedAt?: Date;
  readonly fetchedAt: Date;
}

export interface LocalWeatherReader {
  read(
    location: AquariumLocation,
    options?: { readonly forceRefresh?: boolean },
  ): Promise<LocalWeather>;
}

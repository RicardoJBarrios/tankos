# Configure Location and Review Local Weather

**Status:** Accepted and implemented — personal, non-commercial MVP.

## Product value

The keeper can configure the approximate physical location of an Aquarium and
see a small amount of local outdoor temperature context. This helps the keeper
notice environmental conditions that may affect the room or Aquarium without
confusing external weather with Aquarium measurements.

## Scope

This slice contains one configuration transition and one read capability:

```text
Aquarium.location = undefined
    → confirmed approximate location
    → local current temperature and today's minimum/maximum
```

It does not include location correction, relocation, weather alerts, humidity,
weather icons, preventive recommendations, notifications, automation, weather
history or Timeline integration.

## Accepted provider

The first implementation uses Open-Meteo's public forecast and geocoding APIs.
The current personal MVP is non-commercial. The free service is rate-limited,
has no uptime guarantee and requires CC BY attribution; commercial use requires
the provider's commercial plan. This commercial-use boundary must be revisited
before public commercial distribution.

Open-Meteo is selected because the same provider supplies locality search,
coordinates, timezone suggestions and weather forecast data without a browser
secret. Provider names remain infrastructure concerns.

## Location model

The persisted location contains only:

- `latitude`: approximate WGS84 latitude rounded to two decimal places;
- `longitude`: approximate WGS84 longitude rounded to two decimal places;
- `displayName`: a concise locality and country label.

Two decimal places provide roughly kilometre-scale precision, appropriate for
the weather model and less precise than a household address. No street,
building, postal address, provider payload or provider place ID is persisted.

`location` is optional Aquarium configuration. Existing Aquariums remain valid
without it. The domain does not use Firebase `GeoPoint` or provider-specific
types.

## Acquisition and confirmation

The keeper searches for a locality and selects a result showing enough region
and country context to disambiguate it. The selected coordinates and label are
shown before confirmation. Browser Geolocation is not used in this slice.

The selected location never silently changes `Aquarium.timeZone`. If a provider
result includes a timezone, it may be shown as a separate proposal only. The
keeper must use the existing explicit timezone configuration capability to set
an absent timezone.

Only the transition from missing to configured location is supported. Changing
an existing location and physical relocation remain separate future decisions.

## Weather read model

The first read model is `LocalWeather` and contains only:

- current outside temperature in canonical Celsius;
- today's forecast minimum in Celsius;
- today's forecast maximum in Celsius;
- provider observation/update timestamp where supplied;
- fetch timestamp for freshness.

Current values and forecasts remain explicitly labelled. External weather is an
ephemeral read model, not a Measurement, Observation, Care Work, Fact, Domain
Event or Timeline entry.

The application boundary is a narrow `LocalWeatherReader` receiving the
provider-independent Aquarium location and returning `LocalWeather`. A
separate location-search port returns candidate locations. Provider DTOs are
validated at the infrastructure boundary and never reach the domain or UI.

## Workspace behaviour

The Workspace may render an isolated `Entorno exterior` section after Aquarium-
owned information. It shows current outside temperature, today's range and
freshness. Water temperature must remain labelled as an Aquarium Measurement.

If location is missing, the section offers `Configurar ubicación`. If Weather
is loading or unavailable, identity, Measurements, Activity and Care remain
usable. One user-triggered retry is sufficient for the first slice.

Weather must not block Workspace startup and must not cause polling.

## Caching and cost

Use a capability-local in-memory cache with a 15-minute TTL for the current
Workspace session. Do not persist Weather in Firestore or create a weather
collection. A stale response is not a source of truth; if retained later, its
fetch timestamp must be visible.

At personal scale, this keeps requests far below the provider's free daily
limit when the Workspace is opened a normal number of times. Quotas and terms
must be monitored before wider distribution.

## Security and privacy

Only the authenticated owner may configure the Aquarium location. Rules enforce
owner scope, configure-only field shape and numeric ranges; they do not perform
geocoding or Weather validation. Approximate coordinates are sent to the
Weather provider, but Aquarium name, keeper identity, Firebase UID and domain
history are never sent.

The UI explains that the approximate location is used for environmental context
and that Veril does not track the keeper or device.

## Spark and architecture

Location configuration and direct read-only Weather requests are Spark-first
compatible for the personal MVP. No backend proxy, Cloud Function, Blaze,
Notification system, Signal Store, generic Settings framework or Nx library is
required. Provider failure is isolated from Aquarium-owned capabilities.

The current `AquariumListItem` remains a list read model. If Workspace context
needs location while `Mis acuarios` does not, a narrow Workspace context read
model may be introduced only when implementation demonstrates that the current
read model is insufficient.

## Testing

- Domain/application: coordinate ranges, rounding, missing location, ownership
  and configure-only semantics.
- Location adapter/Rules: malformed DTOs, owner update, anonymous/cross-owner
  rejection and extra-field rejection.
- Provider adapters: deterministic fixtures for geocoding and Weather mapping,
  malformed response, timeout and unavailable provider.
- Angular: missing location, search results, confirmation, loading, isolated
  Weather failure and labelled temperatures.
- E2E: deterministic location selection and stubbed Weather response; no live
  provider or geocoder calls.

## Deferred decisions

- commercial/public provider licensing and service-level requirements;
- correction and physical relocation;
- weather alerts, humidity, richer forecasts and stale-data fallback;
- preventive insight thresholds;
- notifications and automation;
- provider replacement or backend proxy if usage or terms require it.

## Definition of Ready assessment

| Criterion              | Result | Evidence                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------- |
| Immediate consumer     | Ready  | Workspace temperature context is part of this slice.                |
| Provider and geocoding | Ready  | One provider supplies both APIs.                                    |
| Secret boundary        | Ready  | Personal public endpoints require no browser key.                   |
| Location model/privacy | Ready  | Approximate coordinates and locality label only.                    |
| Persistence and Rules  | Ready  | Optional nested Aquarium field, owner-scoped configure-only update. |
| Weather behaviour      | Ready  | Narrow read model, isolated loading/error and no persistence.       |
| Cost and Spark         | Ready  | Direct read-only requests, local TTL and no backend.                |
| Testing                | Ready  | Provider fixtures and deterministic E2E are defined.                |

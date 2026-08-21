# TankOS Data Access

**Estado:** contratos core, fachadas de aplicación, composición Angular y
adaptadores deterministas de memoria y caché TTL implementados. Los
adaptadores concretos de Firestore, JSON/HTTP y el worker confiable de
producción siguen siendo fronteras pendientes.

`data-access` contiene comportamiento reutilizable para dominios como Units,
Parameters y Aquarium Systems. No es un dominio de negocio y no define campos
de ninguna entidad concreta.

## Límites

```text
dominio de aplicación
        |
        v
   contratos core
        |
        v
    puertos
     /   \
    v     v
 memoria  caché/decoradores
    |
    v
 Firestore | JSON/HTTP | worker confiable
```

- `core`: tipos, errores y puertos provider-neutral; no depende de Angular ni
  de un proveedor de persistencia.
- `application`: fachadas composables de CRUD y operaciones batch.
- `adapters`: implementaciones intercambiables. `memory` sirve para pruebas y
  prototipos; `cache` añade lectura con TTL e invalidación.
- `composition/angular`: tokens y providers para conectar puertos concretos
  al árbol de inyección de Angular.

Firestore y HTTP no deben filtrarse al `core`, a una entidad de dominio ni a
los contratos públicos. Sus DTOs se convertirán en adaptadores separados,
incluyendo la validación de entrada y salida que corresponda.

## CRUD y lifecycle

`CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>` expone listado,
consulta, creación, reemplazo, marcado para eliminación, restauración y
eliminación definitiva. El registro común contiene `id`, `lifecycle`, número
de versión y `RecordMetadata` con `schemaVersion`, fechas de servidor y,
cuando proceda, los actores.

Las lecturas no filtran por defecto registros `marked-for-deletion` ni
`deleted`. El acceso explícito a estados no visibles es responsabilidad de un
adaptador autorizado. No se usan foreign keys ni cascadas: las referencias
son identificadores y la consistencia entre entidades se coordina en la
capa de aplicación.

Para contratos versionables existe `VersionedRepositoryPort`. Las
modificaciones crean la nueva versión y dejan la anterior inmutable; la
retirada de versiones es una operación explícita y autorizada.

La paginación usa `PageCursor`, un valor opaco y no un `EntityId`. Toda
consulta paginada declara un `pageSize` acotado y un `orderBy` estable; el
cursor solo debe reutilizarse con la misma consulta y orden.

## Operaciones batch

Una operación batch lógica no es un `Firestore WriteBatch`. `submit` congela
el alcance mediante ids o un filtro completo, registra su huella y devuelve
inmediatamente un estado `queued`. La ejecución posterior trabaja en chunks
acotados y publica progreso, warnings y fallos.

```text
submit(selection, confirmationToken) -> queued
                                      |
                                      v
                               worker / chunks
                                      |
                                      v
                               get(batchId)
```

El contrato contempla `update`, `mark-for-deletion` y `delete`, reanudación,
cancelación, resultados por elemento y estados terminales. El estado de
ejecución es temporal: se elimina al completar, fallar definitivamente o
cancelar. Los datos originales no reciben campos de batch.

Las reglas globales aplicables al adaptador de producción son: una sola
confirmación por batch, el filtro afecta a todo el conjunto y no solo a la
página visible, chunks limitados, ejecución asíncrona, idempotencia, orden
natural de última escritura y borrado ganador frente a una modificación
posterior. La autoridad y la autorización del worker no se simulan en el
`core`.

## Caché

`TtlCache` es una caché en memoria con reloj inyectable para pruebas. El
decorador `CachedCrudRepository` aplica lectura-through, TTL por instancia,
`forceRefresh` en lecturas y limpieza conservadora tras cualquier escritura.
La invalidación completa evita servir listas o registros obsoletos cuando no
existe todavía un mecanismo fiable de invalidación por consulta.

La política por defecto para catálogos estables, como Units, debe usar TTL
largo. Las mutaciones invalidan inmediatamente; una acción explícita de
actualización puede usar `forceRefresh` sin eliminar la caché global.

## Composición Angular

Cada entidad tiene sus propios tokens tipados. No existe un token global de
CRUD basado en `unknown`:

```ts
const repositoryToken = createCrudRepositoryToken<UnitData, CreateUnit, UpdateUnit, UnitFilter>('units.repository');
const serviceToken = createCrudServiceToken<UnitData, CreateUnit, UpdateUnit, UnitFilter>('units.service');

providers: [
  provideTankOsDataAccess({ batchOperation }),
  provideCrudRepository(repositoryToken, unitRepository),
  provideCrudService(serviceToken, repositoryToken),
];
```

Los factories usan `inject()` y Angular solo compone dependencias. La
selección de Firestore, HTTP, caché y funciones backend pertenece al host.

## Pendiente

1. Implementar el repositorio Firestore con paginación, metadatos de servidor,
   reglas de lifecycle, costes controlados y pruebas contra emulador.
2. Implementar mappers y adaptadores JSON/HTTP con contratos de DTO y errores
   tipados.
3. Implementar el worker confiable para materializar scopes y ejecutar batches
   de forma reanudable e idempotente.
4. Añadir integración de cada dominio y sus pantallas de gestión.

Cada archivo ejecutable debe tener una responsabilidad y un test enfocado
asociado. Los tests se escriben como especificaciones Given/When/Then y la
librería exige 100% de statements, lines, functions y branches.

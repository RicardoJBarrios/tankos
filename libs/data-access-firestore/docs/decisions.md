# Data access Firestore: decisiones de infraestructura

Este documento es la fuente de verdad de la integración Firestore de
`@tankos/data-access`.

## Consultas y coste

- Toda lista usa `limit`, cursor y un orden estable con desempate por ID.
- No se usa `offset` ni se repiten consultas amplias durante el renderizado.
- Las consultas se limitan al tamaño necesario; los `count()` repetidos no son
  la estrategia por defecto.
- Los índices deben responder a filtros reales y los arrays de búsqueda tienen
  límites explícitos.
- Los previews acotados y los streams en tiempo real se mantienen separados de
  las listas navegables.

## Escrituras

Las escrituras que dependen de estado actual o de unicidad entre documentos se
realizan en transacción. El ID determinista y la reserva de unicidad son
controles complementarios: el ID por sí solo no es una garantía de negocio.
Las sustituciones versionadas y las operaciones con precondición de revisión
son atómicas.

Los timestamps técnicos proceden del `ClockPort` inyectado y se convierten a
`Timestamp` únicamente en este borde. Firestore no genera la identidad de
dominio.

## Seguridad y errores

El adaptador valida DTOs externos antes de mapearlos al dominio y traduce los
errores del proveedor a categorías estables (`forbidden`, `not-found`,
`conflict`, `validation`, `transient` y `permanent`). Las Rules del host son
restrictivas por defecto y no se consideran filtros: la consulta debe ser
compatible con ellas antes de ejecutarse.

El SDK de servidor, si se usa, omite Rules y exige autorización e IAM propios.
El emulador pertenece exclusivamente a desarrollo y tests; no forma parte de
la configuración de producción.

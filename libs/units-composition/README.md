# @tankos/units-composition

Punto de composición Angular de la feature de unidades. Expone el token
`UNIT_DEFINITION_MANAGEMENT_SERVICE` para conectar la aplicación con el
servicio de aplicación de unidades.

## Responsabilidades

- Declarar el punto de inyección estable.
- Mantener la composición fuera de `@tankos/units` y `@tankos/units-ui`.

## Límites y arquitectura

No contiene dominio, casos de uso, Firebase ni componentes. La composition
root proporciona una implementación (por ejemplo, Firestore) y la UI consume
el contrato a través del token.

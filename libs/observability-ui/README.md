# @tankos/observability-ui

Adaptador de composición Angular para observabilidad. Expone únicamente el
token neutral `LOGGER`, para que las librerías reciban un logger sin depender
de Angular ni de una implementación concreta.

## Responsabilidades

- Declarar el punto de inyección `LOGGER`.
- Permitir que la aplicación conecte consola, Firebase u otro backend.

## Límites y arquitectura

El contrato `Logger` vive en `@tankos/observability`; esta librería no importa
Firebase ni registra eventos. La aplicación decide la implementación y el
nivel mínimo por entorno.

# Observability: decisiones de logging y telemetría

Este documento es la fuente de verdad de `@tankos/observability`.

## Contrato

Las librerías dependen de `Logger` y `Telemetry`, nunca de `console`, Firebase
Analytics, Azure Monitor u otro proveedor. La composición del host selecciona
los sinks y el nivel mínimo por entorno.

En desarrollo se permite `debug`; en producción el host puede dejar únicamente
los niveles operativos necesarios. Un sink no disponible no debe romper el
flujo de la aplicación.

## Privacidad

Los eventos se minimizan y se separan del historial de dominio. No se envían a
telemetría mediciones, notas, tokens, credenciales, payloads completos ni
identificadores innecesarios sin una decisión explícita. Los errores se
sanitizan antes de llegar a consola o a un proveedor externo.

## Adaptadores actuales

El contrato es neutral. El workspace ofrece adaptadores para consola y Firebase
Analytics; son opt-in y se conectan desde la composition root. Un futuro sink
de Azure, Google Cloud u otro proveedor debe implementar el mismo contrato sin
introducir dependencias en las librerías consumidoras.

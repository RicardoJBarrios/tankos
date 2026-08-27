# Data access: decisiones compartidas

Este documento es la fuente de verdad de las decisiones específicas del núcleo
`@tankos/data-access`.

## Contrato

El núcleo define puertos y servicios de CRUD, revisiones optimistas, ciclo de
vida, paginación por cursor, caché y operaciones batch. No conoce Firebase,
Firestore, HTTP, Zod ni entidades de negocio.

Los comandos de registros existentes requieren `expectedRevision`. Los
reintentos deben ser idempotentes. El adaptador no hace lecturas posteriores
innecesarias tras una escritura.

## Ciclo de vida y versionado

El borrado ordinario es lógico. Restaurar y borrar físicamente son comandos
explícitos y autorizados. Las definiciones cuyo significado pueda cambiar se
reemplazan creando una nueva versión; la versión anterior conserva su
identidad y recorre su ciclo de vida.

La sustitución que dependa de varias escrituras debe ejecutarse con el puerto
atómico del adaptador. Una implementación no debe crear primero la versión
nueva y marcar después la anterior fuera de una transacción.

## Listas y batches

Las listas navegables usan cursor, orden determinista y `limit`; nunca offset.
El tamaño por defecto es 20 y el máximo público es 50. Una operación batch
confirma una vez el alcance completo, congela los IDs y permite fallos parciales,
reintentos y progreso por chunks. El motor genérico coordina chunking,
idempotencia y progreso; la política de autorización y la semántica de cada
entidad permanecen en su contexto.

El cliente no ejecuta escrituras administrativas ilimitadas. La ejecución
serverless/trusted que requiera privilegios es responsabilidad del adaptador o
de la composición del host, no del dominio.

## Dependencias

La dirección permitida es `application -> core/ports`; los adaptadores dependen
del contrato. Ningún adaptador se reexporta accidentalmente desde el paquete
principal.

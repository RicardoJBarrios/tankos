# Time: decisiones temporales

`@tankos/time` distingue `Instant`, `LocalDate`, fecha-hora con zona y
duración. Los instantes persistidos se normalizan a UTC; una zona IANA solo se
usa cuando el significado es calendario/local.

La librería no conoce Aquarium, Measurements, Firestore ni HTTP. Las
representaciones de `Timestamp` y strings pertenecen respectivamente a
`time-firestore` y `time-json-http`; Zod pertenece a `time-zod`.

La UI debe mostrar fechas de negocio en la zona autorizada por su contexto y
no confundir la zona del navegador con la del recurso. No se añade Temporal
hasta que un caso de uso lo justifique.
